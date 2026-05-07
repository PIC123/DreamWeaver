'use client';

import { getSupabaseClient } from '@/lib/supabase/client';
import { deleteStoryViaApi, postUploadImage } from '@/lib/api';
import type { DisplayMessage, HistoryEntry, StoryRow } from '@/types/story';

export type SaveStoryInput = {
  storyId: string;
  userId: string | null;
  setting: string;
  imgUrl: string | null;
  storyImages: string[];
  messageHistory: HistoryEntry[];
  messages: DisplayMessage[];
  possibleActions: string[];
  isAnonymous: boolean;
  anonToken: string | null;
};

export async function saveStory(input: SaveStoryInput): Promise<{ error: Error | null }> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from('stories').upsert(
    {
      story_id: input.storyId,
      user_id: input.userId,
      setting: input.setting,
      img_url: input.imgUrl,
      story_images: input.storyImages,
      message_history: input.messageHistory,
      messages: input.messages,
      possible_actions: input.possibleActions,
      is_anonymous: input.isAnonymous,
      anon_token: input.anonToken,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'story_id' },
  );
  return { error: error ?? null };
}

export async function loadStory(
  storyId: string,
): Promise<{ data: StoryRow | null; error: Error | null }> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('stories')
    .select('*')
    .eq('story_id', storyId)
    .maybeSingle();
  return { data: (data as StoryRow | null) ?? null, error: error ?? null };
}

export async function getUserStories(
  userId: string,
): Promise<{ data: StoryRow[]; error: Error | null }> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('stories')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
  return { data: (data as StoryRow[] | null) ?? [], error: error ?? null };
}

export async function deleteStory(
  storyId: string,
  anonToken: string | null,
): Promise<{ error: Error | null }> {
  try {
    await deleteStoryViaApi(storyId, anonToken);
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err : new Error(String(err)) };
  }
}

/** Re-export for convenience so call sites import from one place. */
export { postUploadImage as uploadImage };
