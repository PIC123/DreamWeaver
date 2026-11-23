import 'server-only';
import { getAdmin } from '@/lib/supabase/server';
import { SCENE_COLUMNS, STORY_COLUMNS, type SceneRow, type StoryRow } from '@/lib/story/rows';
import { HttpError, isUuid } from './http';
import type { RequestUser } from './auth';

/** Loads a story the caller owns, or throws 404/403. */
export async function loadOwnedStory(storyId: string, user: RequestUser): Promise<StoryRow> {
  if (!isUuid(storyId)) throw new HttpError(404, 'Story not found.');
  const { data, error } = await getAdmin()
    .from('stories')
    .select(STORY_COLUMNS)
    .eq('id', storyId)
    .maybeSingle();
  if (error) throw new Error(`load story failed: ${error.message}`);
  if (!data) throw new HttpError(404, 'Story not found.');
  const row = data as StoryRow;
  if (row.user_id !== user.id) throw new HttpError(403, 'Only the author can change this story.');
  return row;
}

export async function loadScenes(storyId: string): Promise<SceneRow[]> {
  const { data, error } = await getAdmin()
    .from('scenes')
    .select(SCENE_COLUMNS)
    .eq('story_id', storyId)
    .order('position', { ascending: true });
  if (error) throw new Error(`load scenes failed: ${error.message}`);
  return (data ?? []) as SceneRow[];
}

export const IMAGE_BUCKET = 'story-images';

/** Removes every stored illustration for a story. */
export async function deleteStoryImages(storyId: string): Promise<void> {
  const bucket = getAdmin().storage.from(IMAGE_BUCKET);
  const { data: files, error } = await bucket.list(storyId, { limit: 1000 });
  if (error) throw new Error(`list images failed: ${error.message}`);
  if (!files?.length) return;
  const { error: removeError } = await bucket.remove(files.map((f) => `${storyId}/${f.name}`));
  if (removeError) throw new Error(`remove images failed: ${removeError.message}`);
}

export const draftFolder = (userId: string) => `characters/drafts/${userId}`;
export const portraitPath = (characterId: string) => `characters/${characterId}.webp`;

/** Removes any unchosen portrait options a user has left behind. */
export async function clearPortraitDrafts(userId: string): Promise<void> {
  const bucket = getAdmin().storage.from(IMAGE_BUCKET);
  const { data: files, error } = await bucket.list(draftFolder(userId), { limit: 100 });
  if (error) throw new Error(`list drafts failed: ${error.message}`);
  if (!files?.length) return;
  const { error: removeError } = await bucket.remove(
    files.map((f) => `${draftFolder(userId)}/${f.name}`),
  );
  if (removeError) throw new Error(`remove drafts failed: ${removeError.message}`);
}
