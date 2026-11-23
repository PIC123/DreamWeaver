'use client';

import { getSupabase } from '@/lib/supabase/browser';
import {
  CHARACTER_COLUMNS,
  SCENE_COLUMNS,
  STORY_COLUMNS,
  toCharacter,
  toScene,
  toStory,
  type CharacterRow,
  type SceneRow,
  type StoryRow,
} from '@/lib/story/rows';
import type { StoryBible } from '@/lib/story/bible';
import type { ArtStyle, ReadingLevel } from '@/lib/story/options';
import type { Character, Scene, Story, TurnEvent } from '@/lib/story/types';

/** A failed API call. `message` is written for the person using the app. */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    /** Set when the server says the same request should work after this many seconds. */
    public retryAfter?: number,
  ) {
    super(message);
  }
}

const sleep = (seconds: number) => new Promise((resolve) => setTimeout(resolve, seconds * 1000));

/**
 * Runs a request and, if the server says it was only turned away for being
 * busy, waits as long as it asks and tries again, up to `retries` times.
 */
export async function retryWhenBusy<T>(
  request: () => Promise<T>,
  onWaiting?: (seconds: number) => void,
  retries = 2,
): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await request();
    } catch (err) {
      if (!(err instanceof ApiError) || !err.retryAfter || attempt >= retries) throw err;
      onWaiting?.(err.retryAfter);
      await sleep(err.retryAfter);
    }
  }
}

async function authedFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const { data } = await getSupabase().auth.getSession();
  const token = data.session?.access_token;
  const headers = new Headers(init.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (init.body) headers.set('Content-Type', 'application/json');

  let res: Response;
  try {
    res = await fetch(path, { ...init, headers });
  } catch {
    throw new ApiError(0, "Couldn't reach DreamWeaver. Check your connection and try again.");
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as {
      error?: string;
      retryAfter?: number;
    } | null;
    throw new ApiError(
      res.status,
      body?.error ?? `Request failed (${res.status}).`,
      typeof body?.retryAfter === 'number' ? body.retryAfter : undefined,
    );
  }
  return res;
}

async function postJson<T>(path: string, body?: unknown, method = 'POST'): Promise<T> {
  const res = await authedFetch(path, {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return (await res.json()) as T;
}

// ── writes (all go through the server) ──────────────────────────────────────

export type NewStory = {
  setting: string;
  readingLevel: ReadingLevel;
  artStyle: ArtStyle;
  characterId: string | null;
};

export const createStory = (story: NewStory) =>
  postJson<{ id: string }>('/api/stories', story).then((r) => r.id);

/** An open set of portrait options: `options` is how many there are to paint. */
export type PortraitDraft = { draftId: string; appearance: string; options: number };

export const draftCharacter = (name: string, description: string) =>
  postJson<PortraitDraft>('/api/characters/drafts', { name, description });

/** Paints one option of an open set and returns its picture. Safe to retry. */
export const paintPortrait = (draftId: string, option: number) =>
  postJson<{ url: string }>(`/api/characters/drafts/${draftId}/portraits`, { option }).then(
    (r) => r.url,
  );

export const saveCharacter = (input: {
  name: string;
  appearance: string;
  draftId: string;
  option: number;
}) => postJson<{ character: Character }>('/api/characters', input).then((r) => r.character);

export const deleteCharacter = (characterId: string) =>
  postJson<{ ok: true }>(`/api/characters/${characterId}`, undefined, 'DELETE');

export const setSharing = (storyId: string, isPublic: boolean) =>
  postJson<{ isPublic: boolean }>(`/api/stories/${storyId}`, { isPublic }, 'PATCH');

export const deleteStory = (storyId: string) =>
  postJson<{ ok: true }>(`/api/stories/${storyId}`, undefined, 'DELETE');

export const paintScene = (storyId: string, sceneId: string) =>
  postJson<{ imageUrl: string }>(`/api/stories/${storyId}/scenes/${sceneId}/image`).then(
    (r) => r.imageUrl,
  );

export const randomSetting = () =>
  postJson<{ setting: string }>('/api/random-setting').then((r) => r.setting);

export const prepareClaim = () =>
  postJson<{ ticket: string | null }>('/api/claim/prepare').then((r) => r.ticket);

export const claimStories = (ticket: string) =>
  postJson<{ claimed: number }>('/api/claim', { ticket }).then((r) => r.claimed);

export type TurnResult = { scene: Scene; bible: StoryBible; finished: boolean };

/** Requests the next scene, calling `onDelta` with narration text as it streams in. */
export async function takeTurn(
  storyId: string,
  input: { action: string | null; expectedPosition: number; ending?: boolean },
  onDelta: (text: string) => void,
): Promise<TurnResult> {
  const res = await authedFetch(`/api/stories/${storyId}/turns`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
  if (!res.body) throw new ApiError(0, 'The story stream was empty.');

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let result: TurnResult | null = null;

  const handle = (line: string) => {
    if (!line.trim()) return;
    const event = JSON.parse(line) as TurnEvent;
    if (event.type === 'delta') onDelta(event.text);
    else if (event.type === 'scene') {
      result = { scene: event.scene, bible: event.bible, finished: event.finished };
    } else throw new ApiError(event.message.includes('moved on') ? 409 : 502, event.message);
  };

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let newline: number;
    while ((newline = buffer.indexOf('\n')) !== -1) {
      handle(buffer.slice(0, newline));
      buffer = buffer.slice(newline + 1);
    }
  }
  handle(buffer);

  if (!result) throw new ApiError(502, 'The storyteller stopped mid-sentence. Please try again.');
  return result;
}

// ── reads (straight from Supabase; row level security decides what is visible) ──

export async function fetchStory(storyId: string): Promise<Story | null> {
  const { data, error } = await getSupabase()
    .from('stories')
    .select(STORY_COLUMNS)
    .eq('id', storyId)
    .maybeSingle();
  if (error) throw new ApiError(500, "Couldn't load this story.");
  return data ? toStory(data as StoryRow) : null;
}

export async function fetchScenes(storyId: string): Promise<Scene[]> {
  const { data, error } = await getSupabase()
    .from('scenes')
    .select(SCENE_COLUMNS)
    .eq('story_id', storyId)
    .order('position', { ascending: true });
  if (error) throw new ApiError(500, "Couldn't load this story's pages.");
  return ((data ?? []) as SceneRow[]).map(toScene);
}

export async function fetchMyStories(userId: string): Promise<Story[]> {
  const { data, error } = await getSupabase()
    .from('stories')
    .select(STORY_COLUMNS)
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
  if (error) throw new ApiError(500, "Couldn't load your stories.");
  return ((data ?? []) as StoryRow[]).map(toStory);
}

export async function fetchMyCharacters(userId: string): Promise<Character[]> {
  const { data, error } = await getSupabase()
    .from('characters')
    .select(CHARACTER_COLUMNS)
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (error) throw new ApiError(500, "Couldn't load your characters.");
  return ((data ?? []) as CharacterRow[]).map(toCharacter);
}
