import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/server/auth';
import { assertAllowed } from '@/lib/server/ai';
import { HttpError, isUuid, readJson, route } from '@/lib/server/http';
import { IMAGE_BUCKET, clearPortraitDrafts, draftFolder, portraitPath } from '@/lib/server/stories';
import { getAdmin } from '@/lib/supabase/server';
import { CHARACTER_LIMITS } from '@/lib/story/options';
import { CHARACTER_COLUMNS, toCharacter, type CharacterRow } from '@/lib/story/rows';

/** Step two of the character creator: keep the portrait the reader chose. */
export const POST = route(async (req: Request) => {
  const user = await requireUser(req);
  const body = await readJson<{
    name?: unknown;
    appearance?: unknown;
    draftId?: unknown;
    option?: unknown;
  }>(req);

  const name = typeof body.name === 'string' ? body.name.replace(/\s+/g, ' ').trim() : '';
  const appearance =
    typeof body.appearance === 'string' ? body.appearance.replace(/\s+/g, ' ').trim() : '';
  const option = body.option;

  if (!name || name.length > CHARACTER_LIMITS.nameMaxLength) {
    throw new HttpError(400, 'Give your character a name.');
  }
  if (!appearance || appearance.length > 320) throw new HttpError(400, 'Invalid appearance.');
  if (typeof body.draftId !== 'string' || !isUuid(body.draftId)) {
    throw new HttpError(400, 'Invalid portrait set.');
  }
  if (
    typeof option !== 'number' ||
    !Number.isInteger(option) ||
    option < 0 ||
    option >= CHARACTER_LIMITS.portraitOptions
  ) {
    throw new HttpError(400, 'Choose one of the portraits.');
  }
  // The reader may have edited the look after it was written for them.
  await assertAllowed(`${name}\n${appearance}`);

  const admin = getAdmin();
  const { count, error: countError } = await admin
    .from('characters')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id);
  if (countError) throw new Error(`count characters failed: ${countError.message}`);
  if ((count ?? 0) >= CHARACTER_LIMITS.maxPerUser) {
    throw new HttpError(
      409,
      `You can keep up to ${CHARACTER_LIMITS.maxPerUser} characters. Delete one to make room.`,
    );
  }

  // The portrait is found from the reader's own draft folder, never from a URL they send.
  const id = randomUUID();
  const bucket = admin.storage.from(IMAGE_BUCKET);
  const source = `${draftFolder(user.id)}/${body.draftId}-${option}.webp`;
  const { error: moveError } = await bucket.move(source, portraitPath(id));
  if (moveError) {
    throw new HttpError(409, 'Those portraits have expired. Paint a new set and choose again.');
  }

  const { data, error } = await admin
    .from('characters')
    .insert({
      id,
      user_id: user.id,
      name,
      appearance,
      portrait_url: bucket.getPublicUrl(portraitPath(id)).data.publicUrl,
    })
    .select(CHARACTER_COLUMNS)
    .single();
  if (error) throw new Error(`save character failed: ${error.message}`);

  await clearPortraitDrafts(user.id).catch((err) => console.error(err));
  return NextResponse.json({ character: toCharacter(data as CharacterRow) }, { status: 201 });
});
