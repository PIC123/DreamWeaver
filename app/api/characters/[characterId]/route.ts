import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/server/auth';
import { HttpError, isUuid, route } from '@/lib/server/http';
import { IMAGE_BUCKET, portraitPath } from '@/lib/server/stories';
import { getAdmin } from '@/lib/supabase/server';

type Ctx = { params: Promise<{ characterId: string }> };

/** Deletes a saved character and its portrait. Stories already using it are unaffected. */
export const DELETE = route(async (req: Request, ctx: Ctx) => {
  const { characterId } = await ctx.params;
  const user = await requireUser(req);
  if (!isUuid(characterId)) throw new HttpError(404, 'Character not found.');

  const admin = getAdmin();
  const { data, error } = await admin
    .from('characters')
    .delete()
    .eq('id', characterId)
    .eq('user_id', user.id)
    .select('id');
  if (error) throw new Error(`delete character failed: ${error.message}`);
  if (!data?.length) throw new HttpError(404, 'Character not found.');

  const { error: removeError } = await admin.storage
    .from(IMAGE_BUCKET)
    .remove([portraitPath(characterId)]);
  if (removeError) console.error('remove portrait failed:', removeError.message);

  return NextResponse.json({ ok: true });
});
