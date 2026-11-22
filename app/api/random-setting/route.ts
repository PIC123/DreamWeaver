import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/server/auth';
import { FALLBACK_SETTINGS, inventSetting } from '@/lib/server/ai';
import { route } from '@/lib/server/http';
import { spendQuota } from '@/lib/server/quota';

export const maxDuration = 30;

function fallback() {
  return FALLBACK_SETTINGS[Math.floor(Math.random() * FALLBACK_SETTINGS.length)];
}

export const POST = route(async (req: Request) => {
  const user = await requireUser(req);
  try {
    await spendQuota(user, 'setting');
    return NextResponse.json({ setting: await inventSetting() });
  } catch (err) {
    // Out of budget or the model hiccuped: a hand-written idea is still a good idea.
    console.warn('random setting fell back:', err instanceof Error ? err.message : err);
    return NextResponse.json({ setting: fallback(), fallback: true });
  }
});
