'use client';

/**
 * Persistent identity for anonymous users so they can keep editing their stories
 * across sessions without an account. Stored as { storyId: anonToken } in localStorage.
 */
const KEY = 'dw.anon.tokens.v1';

type Map = Record<string, string>;

function load(): Map {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as Map) : {};
  } catch {
    return {};
  }
}

function save(map: Map) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    /* ignore quota errors */
  }
}

export function getAnonToken(storyId: string): string | null {
  return load()[storyId] ?? null;
}

export function setAnonToken(storyId: string, token: string) {
  const map = load();
  map[storyId] = token;
  save(map);
}

export function forgetAnonToken(storyId: string) {
  const map = load();
  delete map[storyId];
  save(map);
}

export function listAnonStoryIds(): string[] {
  return Object.keys(load());
}
