import 'server-only';
import { getAdmin } from '@/lib/supabase/server';
import type { ReadingLevel } from '@/lib/story/options';
import { normalizePlan, rollSeeds, seedsOnlyPlan, type StoryPlan } from '@/lib/story/plan';
import { draftPlan } from './ai';

/**
 * Plans a new story and stores the plan where only the server can read it.
 * Never throws: a story without a full plan still gets its ingredients and
 * pacing, and a story without a stored plan still works.
 */
export async function createPlan(input: {
  storyId: string;
  setting: string;
  level: ReadingLevel;
  heroLook: string | null;
}): Promise<void> {
  const seeds = rollSeeds(input.level);
  let plan: StoryPlan = seedsOnlyPlan(seeds);
  try {
    plan = { ...seeds, ...(await draftPlan({ ...input, seeds })) };
  } catch (err) {
    console.error('story plan failed; continuing with ingredients only:', err);
  }

  const { error } = await getAdmin().from('story_plans').upsert({ story_id: input.storyId, plan });
  if (error) console.error('save story plan failed:', error.message);
}

/** The stored plan, or null for stories written before plans existed. */
export async function loadPlan(storyId: string, level: ReadingLevel): Promise<StoryPlan | null> {
  const { data, error } = await getAdmin()
    .from('story_plans')
    .select('plan')
    .eq('story_id', storyId)
    .maybeSingle();
  if (error) {
    console.error('load story plan failed:', error.message);
    return null;
  }
  return data ? normalizePlan(data.plan, level) : null;
}
