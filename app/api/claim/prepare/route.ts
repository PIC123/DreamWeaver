import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/server/auth';
import { route } from '@/lib/server/http';
import { getAdmin } from '@/lib/supabase/server';

/**
 * Called by a guest just before they sign in or sign up. Returns a ticket that
 * lets the account they end up in adopt the stories they wrote as a guest.
 */
export const POST = route(async (req: Request) => {
  const user = await requireUser(req);
  if (!user.isGuest) return NextResponse.json({ ticket: null });

  const admin = getAdmin();
  // Nothing to carry over unless the guest has written a story or made a character.
  let owned = 0;
  for (const table of ['stories', 'characters'] as const) {
    const { count, error: countError } = await admin
      .from(table)
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id);
    if (countError) throw new Error(`count ${table} failed: ${countError.message}`);
    owned += count ?? 0;
  }
  if (owned === 0) return NextResponse.json({ ticket: null });

  const { data, error } = await admin
    .from('claim_tickets')
    .insert({ anon_user_id: user.id })
    .select('ticket')
    .single();
  if (error) throw new Error(`create ticket failed: ${error.message}`);

  return NextResponse.json({ ticket: data.ticket as string });
});
