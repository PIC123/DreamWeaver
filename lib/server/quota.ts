import 'server-only';
import { getAdmin } from '@/lib/supabase/server';
import { serverEnv } from '@/lib/env.server';
import { HttpError } from './http';
import type { RequestUser } from './auth';

type Kind = 'turn' | 'setting' | 'portrait';

/** Spends one unit of the user's daily budget, or throws a 429 explaining why not. */
export async function spendQuota(user: RequestUser, kind: Kind): Promise<void> {
  const q = serverEnv.quota;
  const limits = {
    turn: [user.isGuest ? q.guestTurns : q.memberTurns, q.globalTurns],
    setting: [q.userSettings, q.globalSettings],
    portrait: [user.isGuest ? q.guestPortraits : q.memberPortraits, q.globalPortraits],
  } as const;
  const [userLimit, globalLimit] = limits[kind];

  const { data, error } = await getAdmin().rpc('consume_quota', {
    p_user: user.id,
    p_kind: kind,
    p_user_limit: userLimit,
    p_global_limit: globalLimit,
  });
  if (error) throw new Error(`consume_quota failed: ${error.message}`);

  if (data === 'user_limit') {
    throw new HttpError(
      429,
      user.isGuest
        ? "You've reached today's limit for guests. Create a free account to keep going, or come back tomorrow."
        : "You've reached today's limit. It resets over the next 24 hours.",
    );
  }
  if (data === 'global_limit') {
    throw new HttpError(
      429,
      'DreamWeaver is very busy today and has paused new pictures and scenes. Please try again later.',
    );
  }
}
