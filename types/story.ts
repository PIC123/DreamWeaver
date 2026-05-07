/**
 * Display message rendered in the chat UI.
 * Stable shape used throughout the client.
 */
export type DisplayMessage = {
  text: string;
  sender: 'human' | 'system';
};

/**
 * Pair format used to persist conversation history to Supabase.
 * Tuple matches what the legacy schema stores in `message_history` (jsonb).
 */
export type HistoryEntry = ['system' | 'human' | 'assistant', string];

/** Shape the LLM is instructed to return. */
export type StoryTurn = {
  storyText: string;
  possibleActions: string[];
  location?: { x: number; y: number };
  dallEPrompt: string;
};

/** Persisted row shape (camelCase mirror of the Supabase row). */
export type StoryRow = {
  id: string;
  user_id: string | null;
  story_id: string;
  setting: string | null;
  img_url: string | null;
  story_images: string[];
  message_history: HistoryEntry[];
  messages: DisplayMessage[];
  possible_actions: string[];
  is_anonymous: boolean;
  anon_token: string | null;
  created_at: string;
  updated_at: string;
};
