import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/server/auth';
import { HttpError, isUuid, readJson, route } from '@/lib/server/http';
import { getAdmin } from '@/lib/supabase/server';

const TICKET_LIFETIME_MS = 14 * 24 * 60 * 60 * 1000;

/** Moves a guest's stories into the signed-in account that presents their ticket. */
export const POST = route(async (req: Request) => {
  const user = await requireUser(req);
  if (user.isGuest) throw new HttpError(400, 'Sign in to an account before claiming stories.');

  const body = await readJson<{ ticket?: unknown }>(req);
  if (typeof body.ticket !== 'string' || !isUuid(body.ticket)) {
    throw new HttpError(400, 'Invalid ticket.');
  }

  const admin = getAdmin();
  const { data: ticket, error } = await admin
    .from('claim_tickets')
    .select('ticket, anon_user_id, created_at')
    .eq('ticket', body.ticket)
    .maybeSingle();
  if (error) throw new Error(`load ticket failed: ${error.message}`);
  if (!ticket) return NextResponse.json({ claimed: 0 });

  let claimed = 0;
  const fresh = Date.now() - new Date(ticket.created_at as string).getTime() < TICKET_LIFETIME_MS;
  if (fresh && ticket.anon_user_id !== user.id) {
    const { data: moved, error: moveError } = await admin
      .from('stories')
      .update({ user_id: user.id })
      .eq('user_id', ticket.anon_user_id as string)
      .select('id');
    if (moveError) throw new Error(`claim stories failed: ${moveError.message}`);
    claimed = moved?.length ?? 0;
  }

  const { error: deleteError } = await admin
    .from('claim_tickets')
    .delete()
    .eq('ticket', body.ticket);
  if (deleteError) console.error('delete ticket failed:', deleteError.message);

  return NextResponse.json({ claimed });
});
