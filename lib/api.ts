'use client';

import { getSupabase } from '@/lib/supabase/browser';
import {
  SCENE_COLUMNS,
  STORY_COLUMNS,
  toScene,
  toStory,
  type SceneRow,
  type StoryRow,
} from '@/lib/story/rows';
import type { Scene, Story, TurnEvent } from '@/lib/story/types';

/** A failed API call. `message` is written for the person using the app. */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
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
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(res.status, body?.error ?? `Request failed (${res.status}).`);
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

export const createStory = (setting: string) =>
  postJson<{ id: string }>('/api/stories', { setting }).then((r) => r.id);

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

/** Requests the next scene, calling `onDelta` with narration text as it streams in. */
export async function takeTurn(
  storyId: string,
  input: { action: string | null; expectedPosition: number },
  onDelta: (text: string) => void,
): Promise<Scene> {
  const res = await authedFetch(`/api/stories/${storyId}/turns`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
  if (!res.body) throw new ApiError(0, 'The story stream was empty.');

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let scene: Scene | null = null;

  const handle = (line: string) => {
    if (!line.trim()) return;
    const event = JSON.parse(line) as TurnEvent;
    if (event.type === 'delta') onDelta(event.text);
    else if (event.type === 'scene') scene = event.scene;
    else throw new ApiError(event.message.includes('moved on') ? 409 : 502, event.message);
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

  if (!scene) throw new ApiError(502, 'The storyteller stopped mid-sentence. Please try again.');
  return scene;
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
