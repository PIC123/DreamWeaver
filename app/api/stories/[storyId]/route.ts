import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseAdmin, getSupabaseServer } from '@/lib/supabase/server';

export const runtime = 'nodejs';

type Params = { params: Promise<{ storyId: string }> };

/**
 * Cascade-delete a story: removes Storage objects under {storyId}/ then deletes the row.
 * Authorized for the row's owner (auth user) or the holder of the row's anon_token.
 */
export async function DELETE(req: NextRequest, ctx: Params) {
  const { storyId } = await ctx.params;
  if (!storyId) return NextResponse.json({ error: 'Missing storyId' }, { status: 400 });

  const auth = req.headers.get('authorization');
  const accessToken = auth ? auth.replace(/^Bearer\s+/i, '') : null;
  const anonToken = req.headers.get('x-anon-token');

  let admin;
  try {
    admin = getSupabaseAdmin();
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server config error';
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const { data: story, error: storyErr } = await admin
    .from('stories')
    .select('user_id, is_anonymous, anon_token')
    .eq('story_id', storyId)
    .maybeSingle();

  if (storyErr) return NextResponse.json({ error: storyErr.message }, { status: 500 });
  if (!story) return NextResponse.json({ error: 'Story not found' }, { status: 404 });

  let authorized = false;
  if (story.is_anonymous) {
    authorized = !!anonToken && story.anon_token === anonToken;
  } else if (accessToken) {
    const supa = getSupabaseServer(accessToken);
    const { data: userResp } = await supa.auth.getUser();
    authorized = userResp?.user?.id === story.user_id;
  }
  if (!authorized) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // List + delete all storage objects for this story
  const { data: files } = await admin.storage.from('story-images').list(storyId, { limit: 1000 });
  if (files && files.length > 0) {
    const paths = files.map((f) => `${storyId}/${f.name}`);
    await admin.storage.from('story-images').remove(paths);
  }

  const { error: delErr } = await admin.from('stories').delete().eq('story_id', storyId);
  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
