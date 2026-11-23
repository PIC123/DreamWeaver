'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { getSupabase } from '@/lib/supabase/browser';
import {
  DEFAULT_ART_STYLE,
  DEFAULT_READING_LEVEL,
  isArtStyle,
  isReadingLevel,
  type ArtStyle,
  type ReadingLevel,
} from '@/lib/story/options';

/** How a reader likes their stories by default. */
export type Preferences = {
  readingLevel: ReadingLevel;
  artStyle: ArtStyle;
  /** The saved character to play as by default, if any. */
  characterId: string | null;
  /** True once a member has been through (or skipped) the welcome step. */
  onboarded: boolean;
};

const DEFAULTS: Preferences = {
  readingLevel: DEFAULT_READING_LEVEL,
  artStyle: DEFAULT_ART_STYLE,
  characterId: null,
  onboarded: false,
};

const STORAGE_KEY = 'dw.preferences';
const CHANGED = 'dw:preferences-changed';
/** Where a member's preferences live in their Supabase profile. */
const METADATA_KEY = 'dreamweaver_preferences';

function parse(value: unknown): Preferences {
  const v = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>;
  return {
    readingLevel: isReadingLevel(v.readingLevel) ? v.readingLevel : DEFAULTS.readingLevel,
    artStyle: isArtStyle(v.artStyle) ? v.artStyle : DEFAULTS.artStyle,
    characterId: typeof v.characterId === 'string' ? v.characterId : null,
    onboarded: v.onboarded === true,
  };
}

// Guests keep their preferences in this browser only.
function readLocal(): string {
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
}

function subscribeLocal(notify: () => void) {
  window.addEventListener(CHANGED, notify);
  window.addEventListener('storage', notify);
  return () => {
    window.removeEventListener(CHANGED, notify);
    window.removeEventListener('storage', notify);
  };
}

/**
 * The reader's default story settings. Members' preferences are stored with
 * their account and follow them between devices; guests' stay in the browser.
 */
export function usePreferences() {
  const { user, isGuest } = useAuth();
  const local = useSyncExternalStore(subscribeLocal, readLocal, () => '');

  let stored: unknown = null;
  if (user && !isGuest) {
    stored = user.user_metadata?.[METADATA_KEY];
  } else if (local) {
    try {
      stored = JSON.parse(local);
    } catch {
      stored = null;
    }
  }
  const preferences = parse(stored);
  const key = JSON.stringify(preferences);

  const save = useCallback(
    async (changes: Partial<Preferences>): Promise<string | null> => {
      const next = { ...(JSON.parse(key) as Preferences), ...changes };
      if (user && !isGuest) {
        const { error } = await getSupabase().auth.updateUser({ data: { [METADATA_KEY]: next } });
        return error ? error.message : null;
      }
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        window.dispatchEvent(new Event(CHANGED));
      } catch {
        /* private mode: the choice simply lasts for this page */
      }
      return null;
    },
    [user, isGuest, key],
  );

  return { preferences, save };
}
