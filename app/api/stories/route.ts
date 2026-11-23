import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/server/auth';
import { assertAllowed } from '@/lib/server/ai';
import { HttpError, isUuid, readJson, route } from '@/lib/server/http';
import { createPlan } from '@/lib/server/plans';
import { getAdmin } from '@/lib/supabase/server';
import { EMPTY_BIBLE, HERO_NAME, type StoryBible } from '@/lib/story/bible';
import {
  DEFAULT_ART_STYLE,
  DEFAULT_READING_LEVEL,
  isArtStyle,
  isReadingLevel,
} from '@/lib/story/options';
import { LIMITS } from '@/lib/story/types';

export const maxDuration = 30;

const MAX_STORIES_PER_USER = 200;

/** Creates an empty story. The opening scene is written by the first turn. */
export const POST = route(async (req: Request) => {
  const user = await requireUser(req);
  const body = await readJson<{
    setting?: unknown;
    readingLevel?: unknown;
    artStyle?: unknown;
    characterId?: unknown;
  }>(req);
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

  // A saved character steps into the story with their look already fixed.
  let heroLook: string | null = null;
  let bible: StoryBible = EMPTY_BIBLE;
  if (body.characterId !== undefined && body.characterId !== null) {
    if (typeof body.characterId !== 'string' || !isUuid(body.characterId)) {
      throw new HttpError(400, 'Unknown character.');
    }
    const { data: character, error: characterError } = await admin
      .from('characters')
      .select('name, appearance')
      .eq('id', body.characterId)
      .eq('user_id', user.id)
      .maybeSingle();
    if (characterError) throw new Error(`load character failed: ${characterError.message}`);
    if (!character) throw new HttpError(400, 'Unknown character.');
    heroLook = `${character.name as string}: ${character.appearance as string}`;
    bible = {
      ...EMPTY_BIBLE,
      characters: [
        {
          name: HERO_NAME,
          role: `named ${character.name as string}`,
          appearance: character.appearance as string,
        },
      ],
    };
  }

  const level = isReadingLevel(body.readingLevel) ? body.readingLevel : DEFAULT_READING_LEVEL;
  const { data, error } = await admin
    .from('stories')
    .insert({
      user_id: user.id,
      setting,
      bible,
      reading_level: level,
      art_style: isArtStyle(body.artStyle) ? body.artStyle : DEFAULT_ART_STYLE,
    })
    .select('id')
    .single();
  if (error) throw new Error(`create story failed: ${error.message}`);

  await createPlan({ storyId: data.id as string, setting, level, heroLook });

  return NextResponse.json({ id: data.id as string }, { status: 201 });
});
