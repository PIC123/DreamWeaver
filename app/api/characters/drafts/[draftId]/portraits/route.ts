import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/server/auth';
import { paintFailure, paintScene } from '@/lib/server/ai';
import { HttpError, isUuid, readJson, route } from '@/lib/server/http';
import { IMAGE_BUCKET, draftBriefPath, draftFolder, draftOptionPath } from '@/lib/server/stories';
import { getAdmin } from '@/lib/supabase/server';
import { CHARACTER_LIMITS, DEFAULT_ART_STYLE } from '@/lib/story/options';
import { buildPortraitPrompt } from '@/lib/story/prompt';

export const maxDuration = 60;

type Ctx = { params: Promise<{ draftId: string }> };

/**
 * Paints one portrait option for an open set. Each option can be painted once;
 * a failed one can be retried. The set was paid for when it was opened, so the
 * most this can ever paint per set is the fixed number of options.
 */
export const POST = route(async (req: Request, ctx: Ctx) => {
  const { draftId } = await ctx.params;
  const user = await requireUser(req);
  const body = await readJson<{ option?: unknown }>(req);
  const option = body.option;

  if (!isUuid(draftId)) throw new HttpError(404, 'Portrait set not found.');
  if (
    typeof option !== 'number' ||
    !Number.isInteger(option) ||
    option < 0 ||
    option >= CHARACTER_LIMITS.portraitOptions
  ) {
    throw new HttpError(400, 'Unknown portrait option.');
  }

  const bucket = getAdmin().storage.from(IMAGE_BUCKET);
  const { data: files, error: listError } = await bucket.list(draftFolder(user.id), { limit: 100 });
  if (listError) throw new Error(`list drafts failed: ${listError.message}`);
  const names = new Set((files ?? []).map((f) => f.name));
  if (!names.has(`${draftId}.txt`)) {
    throw new HttpError(409, 'Those portraits have expired. Start a new set.');
  }

  const path = draftOptionPath(user.id, draftId, option);
  const url = bucket.getPublicUrl(path).data.publicUrl;
  if (names.has(`${draftId}-${option}.webp`)) return NextResponse.json({ url });

  const { data: brief, error: briefError } = await bucket.download(
    draftBriefPath(user.id, draftId),
  );
  if (briefError || !brief) throw new Error(`read draft failed: ${briefError?.message}`);
  const appearance = (await brief.text()).trim();

  let bytes: Buffer;
  try {
    bytes = await paintScene(buildPortraitPrompt(appearance, DEFAULT_ART_STYLE));
  } catch (err) {
    console.error('portrait failed:', err);
    throw paintFailure(err, "The illustrator couldn't paint this portrait.").error;
  }

  const { error: uploadError } = await bucket.upload(path, bytes, {
    contentType: 'image/webp',
    upsert: true,
  });
  if (uploadError) throw new Error(`upload portrait failed: ${uploadError.message}`);

  return NextResponse.json({ url });
});
