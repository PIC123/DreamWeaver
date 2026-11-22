import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/server/auth';
import { paintScene } from '@/lib/server/ai';
import { HttpError, isUuid, route } from '@/lib/server/http';
import { IMAGE_BUCKET, loadOwnedStory } from '@/lib/server/stories';
import { SCENE_COLUMNS, type SceneRow } from '@/lib/story/rows';
import { getAdmin } from '@/lib/supabase/server';
import { buildImagePrompt } from '@/lib/story/prompt';
import { LIMITS } from '@/lib/story/types';

// 60s is the most every Vercel plan allows; see docs/SETUP.md to raise it.
export const maxDuration = 60;

type Ctx = { params: Promise<{ storyId: string; sceneId: string }> };

/**
 * Paints the illustration for one scene from the prompt stored with it, saves it
 * to Storage and records the URL. Safe to call again: a finished scene just
 * returns its picture, and each scene gets a limited number of attempts.
 */
export const POST = route(async (req: Request, ctx: Ctx) => {
  const { storyId, sceneId } = await ctx.params;
  const user = await requireUser(req);
  const story = await loadOwnedStory(storyId, user);
  if (!isUuid(sceneId)) throw new HttpError(404, 'Scene not found.');

  const admin = getAdmin();
  const { data, error } = await admin
    .from('scenes')
    .select(SCENE_COLUMNS)
    .eq('id', sceneId)
    .eq('story_id', story.id)
    .maybeSingle();
  if (error) throw new Error(`load scene failed: ${error.message}`);
  if (!data) throw new HttpError(404, 'Scene not found.');
  const scene = data as SceneRow;

  if (scene.image_url) return NextResponse.json({ imageUrl: scene.image_url });
  if (!scene.image_prompt)
    throw new HttpError(409, 'This scene has no illustration notes to paint from.');
  if (scene.image_attempts >= LIMITS.maxImageAttempts) {
    throw new HttpError(409, 'The illustrator has given up on this scene.');
  }

  // Claim an attempt. If another request got there first, this matches no row.
  const { data: claimed, error: claimError } = await admin
    .from('scenes')
    .update({ image_attempts: scene.image_attempts + 1 })
    .eq('id', scene.id)
    .eq('image_attempts', scene.image_attempts)
    .is('image_url', null)
    .select('id');
  if (claimError) throw new Error(`claim attempt failed: ${claimError.message}`);
  if (!claimed?.length) throw new HttpError(409, 'This scene is already being painted.');

  let bytes: Buffer;
  try {
    bytes = await paintScene(buildImagePrompt(story.setting ?? '', scene.image_prompt));
  } catch (err) {
    console.error('paint failed:', err);
    throw new HttpError(502, "The illustrator couldn't paint this scene.");
  }

  const path = `${story.id}/${scene.id}.webp`;
  const bucket = admin.storage.from(IMAGE_BUCKET);
  const { error: uploadError } = await bucket.upload(path, bytes, {
    contentType: 'image/webp',
    cacheControl: '31536000',
    upsert: true,
  });
  if (uploadError) throw new Error(`upload failed: ${uploadError.message}`);
  const imageUrl = bucket.getPublicUrl(path).data.publicUrl;

  const { error: saveError } = await admin
    .from('scenes')
    .update({ image_url: imageUrl })
    .eq('id', scene.id);
  if (saveError) throw new Error(`save image url failed: ${saveError.message}`);

  if (!story.cover_url) {
    const { error: coverError } = await admin
      .from('stories')
      .update({ cover_url: imageUrl })
      .eq('id', story.id)
      .is('cover_url', null);
    if (coverError) console.error('set cover failed:', coverError.message);
  }

  return NextResponse.json({ imageUrl });
});
