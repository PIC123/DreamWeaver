'use client';

import { getSupabaseClient } from '@/lib/supabase/client';
import type { HistoryEntry, StoryTurn } from '@/types/story';

async function authHeader(): Promise<Record<string, string>> {
  const supabase = getSupabaseClient();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function postChat(input: {
  setting: string;
  history?: HistoryEntry[];
  userInput?: string;
}): Promise<StoryTurn> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
    body: JSON.stringify(input),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error ?? `Chat failed: ${res.status}`);
  return json.turn as StoryTurn;
}

export async function postImage(prompt: string): Promise<string> {
  const res = await fetch('/api/image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
    body: JSON.stringify({ prompt }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error ?? `Image failed: ${res.status}`);
  return json.imageUrl as string;
}

export async function postRandomSetting(): Promise<string> {
  const res = await fetch('/api/random-setting', { method: 'POST' });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error ?? `Random setting failed: ${res.status}`);
  return json.setting as string;
}

export async function postUploadImage(input: {
  imageUrl: string;
  storyId: string;
  imageIndex: number;
  anonToken?: string | null;
}): Promise<string> {
  const res = await fetch('/api/upload-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
    body: JSON.stringify(input),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error ?? `Upload failed: ${res.status}`);
  return json.publicUrl as string;
}

export async function deleteStoryViaApi(storyId: string, anonToken?: string | null): Promise<void> {
  const headers: Record<string, string> = { ...(await authHeader()) };
  if (anonToken) headers['x-anon-token'] = anonToken;
  const res = await fetch(`/api/stories/${encodeURIComponent(storyId)}`, {
    method: 'DELETE',
    headers,
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json?.error ?? `Delete failed: ${res.status}`);
  }
}
