import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/server/auth';
import { assertAllowed, distilAppearance } from '@/lib/server/ai';
import { HttpError, readJson, route } from '@/lib/server/http';
import { spendQuota } from '@/lib/server/quota';
import { IMAGE_BUCKET, clearPortraitDrafts, draftBriefPath } from '@/lib/server/stories';
import { getAdmin } from '@/lib/supabase/server';
import { CHARACTER_LIMITS } from '@/lib/story/options';

export const maxDuration = 30;

/**
 * Step one of the character creator: turn the reader's description into a fixed
 * look and open a set of portrait options. The portraits themselves are painted
 * one request each, so a slow or failed one never costs the others.
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

  // Only the newest set of options is kept. The look is stored beside them so
  // each portrait is painted from what was agreed here, not from a later request.
  await clearPortraitDrafts(user.id);
  const draftId = randomUUID();
  const { error } = await getAdmin()
    .storage.from(IMAGE_BUCKET)
    .upload(draftBriefPath(user.id, draftId), appearance, {
      contentType: 'text/plain; charset=utf-8',
      upsert: true,
    });
  if (error) throw new Error(`save draft failed: ${error.message}`);

  return NextResponse.json({ draftId, appearance, options: CHARACTER_LIMITS.portraitOptions });
});
