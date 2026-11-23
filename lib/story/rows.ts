import { normalizeBible } from './bible';
import { DEFAULT_ART_STYLE, DEFAULT_READING_LEVEL, isArtStyle, isReadingLevel } from './options';
import { LIMITS, type Character, type Scene, type Story } from './types';

// Database row shapes and their mapping to app types, shared by browser and server.

export const STORY_COLUMNS =
  'id, user_id, setting, cover_url, scene_count, is_public, updated_at, bible, reading_level, art_style, finished';
export const SCENE_COLUMNS =
  'id, story_id, position, action, narration, choices, image_prompt, image_url, image_attempts';

export type StoryRow = {
  id: string;
  user_id: string | null;
  setting: string | null;
  cover_url: string | null;
  scene_count: number;
  is_public: boolean;
  updated_at: string;
  bible: unknown;
  reading_level: string | null;
  art_style: string | null;
  finished: boolean | null;
};

export type SceneRow = {
  id: string;
  story_id: string;
  position: number;
  action: string | null;
  narration: string;
  choices: unknown;
  image_prompt: string | null;
  image_url: string | null;
  image_attempts: number;
};

export function toStory(row: StoryRow): Story {
  return {
    id: row.id,
    ownerId: row.user_id,
    setting: row.setting?.trim() || 'An untitled story',
    coverUrl: row.cover_url,
    sceneCount: row.scene_count,
    isPublic: row.is_public,
    updatedAt: row.updated_at,
    bible: normalizeBible(row.bible),
    readingLevel: isReadingLevel(row.reading_level) ? row.reading_level : DEFAULT_READING_LEVEL,
    artStyle: isArtStyle(row.art_style) ? row.art_style : DEFAULT_ART_STYLE,
    finished: row.finished === true,
  };
}

export function toScene(row: SceneRow): Scene {
  return {
    id: row.id,
    position: row.position,
    action: row.action,
    narration: row.narration,
    choices: Array.isArray(row.choices) ? row.choices.map(String) : [],
    imageUrl: row.image_url,
    canPaint: !row.image_url && !!row.image_prompt && row.image_attempts < LIMITS.maxImageAttempts,
  };
}

export const CHARACTER_COLUMNS = 'id, user_id, name, appearance, portrait_url';

export type CharacterRow = {
  id: string;
  user_id: string;
  name: string;
  appearance: string;
  portrait_url: string | null;
};

export function toCharacter(row: CharacterRow): Character {
  return {
    id: row.id,
    name: row.name,
    appearance: row.appearance,
    portraitUrl: row.portrait_url,
  };
}
