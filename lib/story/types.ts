import type { StoryBible } from './bible';

/** One beat of a story: what the reader did, what happened, and its picture. */
export type Scene = {
  id: string;
  position: number;
  action: string | null;
  narration: string;
  choices: string[];
  imageUrl: string | null;
  /** False once the server has given up painting this scene. */
  canPaint: boolean;
};

export type Story = {
  id: string;
  ownerId: string | null;
  setting: string;
  coverUrl: string | null;
  sceneCount: number;
  isPublic: boolean;
  updatedAt: string;
  /** Established characters, places, items and the story so far. */
  bible: StoryBible;
};

/** What the language model returns for each turn. */
export type Turn = {
  narration: string;
  choices: string[];
  imagePrompt: string;
};

/** Lines of the newline-delimited JSON stream from POST /api/stories/:id/turns. */
export type TurnEvent =
  | { type: 'delta'; text: string }
  | { type: 'scene'; scene: Scene; bible: StoryBible }
  | { type: 'error'; message: string };

export const LIMITS = {
  settingMaxLength: 200,
  actionMaxLength: 300,
  maxScenesPerStory: 60,
  maxImageAttempts: 3,
} as const;
