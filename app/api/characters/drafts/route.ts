import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/server/auth';
import { assertAllowed, distilAppearance, paintScene } from '@/lib/server/ai';
import { HttpError, readJson, route } from '@/lib/server/http';
import { spendQuota } from '@/lib/server/quota';
import { IMAGE_BUCKET, clearPortraitDrafts, draftFolder } from '@/lib/server/stories';
import { getAdmin } from '@/lib/supabase/server';
import { CHARACTER_LIMITS, DEFAULT_ART_STYLE } from '@/lib/story/options';
import { buildPortraitPrompt } from '@/lib/story/prompt';

export const maxDuration = 60;

/**
 * Step one of the character creator: turn the reader's description into a fixed
 * look, then paint a few portrait options of it for them to choose from.
 */
export const POST = route(async (req: Request) => {
  const user = await requireUser(req);
  const body = await readJson<{ name?: unknown; description?: unknown }>(req);
  const name = typeof body.name === 'string' ? body.name.replace(/\s+/g, ' ').trim() : '';
  const description = typeof body.description === 'string' ? body.description.trim() : '';

  if (!name) throw new HttpError(400, 'Give your character a name.');
  if (name.length > CHARACTER_LIMITS.nameMaxLength) {
    throw new HttpError(400, `Keep the name under ${CHARACTER_LIMITS.nameMaxLength} characters.`);
  }
  if (description.length < 10) {
    throw new HttpError(400, 'Describe your character in a little more detail.');
  }
  if (description.length > CHARACTER_LIMITS.descriptionMaxLength) {
    throw new HttpError(
      400,
      `Keep the description under ${CHARACTER_LIMITS.descriptionMaxLength} characters.`,
    );
  }
  await assertAllowed(`${name}\n${description}`);
  await spendQuota(user, 'portrait');

  // If the write-up fails, the reader's own words are still a usable look, and
  // they can edit it before saving. Painting should not be held up by it.
  let appearance: string;
  try {
    appearance = await distilAppearance(name, description);
  } catch (err) {
    console.error('distil appearance failed; using the description as written:', err);
    appearance = description.replace(/\s+/g, ' ').trim().slice(0, 320);
  }

  const prompt = buildPortraitPrompt(appearance, DEFAULT_ART_STYLE);
  const painted = await Promise.allSettled(
    Array.from({ length: CHARACTER_LIMITS.portraitOptions }, () => paintScene(prompt)),
  );
  const portraits = painted.flatMap((result) =>
    result.status === 'fulfilled' ? [result.value] : [],
  );
  if (portraits.length === 0) {
    console.error('all portraits failed:', painted);
    throw new HttpError(502, "The illustrator couldn't paint your character. Please try again.");
  }

  // Only the newest set of options is kept.
  await clearPortraitDrafts(user.id);
  const draftId = randomUUID();
  const bucket = getAdmin().storage.from(IMAGE_BUCKET);
  const options: string[] = [];
  for (const [index, bytes] of portraits.entries()) {
    const path = `${draftFolder(user.id)}/${draftId}-${index}.webp`;
    const { error } = await bucket.upload(path, bytes, { contentType: 'image/webp', upsert: true });
    if (error) throw new Error(`upload portrait failed: ${error.message}`);
    options.push(bucket.getPublicUrl(path).data.publicUrl);
  }

  return NextResponse.json({ draftId, appearance, options });
});
