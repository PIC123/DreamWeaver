import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/server/auth';
import { HttpError, readJson, route } from '@/lib/server/http';
import { deleteStoryImages, loadOwnedStory } from '@/lib/server/stories';
import { getAdmin } from '@/lib/supabase/server';

type Ctx = { params: Promise<{ storyId: string }> };

/** Turns sharing on or off. A shared story is readable by anyone with its link. */
export const PATCH = route(async (req: Request, ctx: Ctx) => {
  const { storyId } = await ctx.params;
  const user = await requireUser(req);
  const story = await loadOwnedStory(storyId, user);

  const body = await readJson<{ isPublic?: unknown }>(req);
  if (typeof body.isPublic !== 'boolean')
    throw new HttpError(400, 'isPublic must be true or false.');

  const { error } = await getAdmin()
    .from('stories')
    .update({ is_public: body.isPublic })
    .eq('id', story.id);
  if (error) throw new Error(`update sharing failed: ${error.message}`);

  return NextResponse.json({ isPublic: body.isPublic });
});

/** Deletes a story, its scenes and its stored illustrations. */
export const DELETE = route(async (req: Request, ctx: Ctx) => {
  const { storyId } = await ctx.params;
  const user = await requireUser(req);
  const story = await loadOwnedStory(storyId, user);

  await deleteStoryImages(story.id);
  const { error } = await getAdmin().from('stories').delete().eq('id', story.id);
  if (error) throw new Error(`delete story failed: ${error.message}`);

  return NextResponse.json({ ok: true });
});
