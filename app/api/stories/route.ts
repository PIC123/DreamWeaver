import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/server/auth';
import { assertAllowed } from '@/lib/server/ai';
import { HttpError, readJson, route } from '@/lib/server/http';
import { getAdmin } from '@/lib/supabase/server';
import { LIMITS } from '@/lib/story/types';

export const maxDuration = 30;

const MAX_STORIES_PER_USER = 200;

/** Creates an empty story. The opening scene is written by the first turn. */
export const POST = route(async (req: Request) => {
  const user = await requireUser(req);
  const body = await readJson<{ setting?: unknown }>(req);
  const setting = typeof body.setting === 'string' ? body.setting.replace(/\s+/g, ' ').trim() : '';

  if (!setting) throw new HttpError(400, 'Tell us where your story takes place.');
  if (setting.length > LIMITS.settingMaxLength) {
    throw new HttpError(400, `Keep the setting under ${LIMITS.settingMaxLength} characters.`);
  }
  await assertAllowed(setting);

  const admin = getAdmin();
  const { count, error: countError } = await admin
    .from('stories')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id);
  if (countError) throw new Error(`count stories failed: ${countError.message}`);
  if ((count ?? 0) >= MAX_STORIES_PER_USER) {
    throw new HttpError(409, 'Your bookshelf is full. Delete a story to make room for a new one.');
  }

  const { data, error } = await admin
    .from('stories')
    .insert({ user_id: user.id, setting })
    .select('id')
    .single();
  if (error) throw new Error(`create story failed: ${error.message}`);

  return NextResponse.json({ id: data.id as string }, { status: 201 });
});
