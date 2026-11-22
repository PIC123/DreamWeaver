import 'server-only';
import { getAnon } from '@/lib/supabase/server';
import { HttpError } from './http';

export type RequestUser = { id: string; isGuest: boolean };

/** Resolves a bearer token to a user, or null if it is missing or invalid. */
export async function userFromToken(token: string | null | undefined): Promise<RequestUser | null> {
  if (!token) return null;
  const { data, error } = await getAnon().auth.getUser(token);
  if (error || !data.user) return null;
  return { id: data.user.id, isGuest: data.user.is_anonymous === true };
}

export function bearerToken(req: Request): string | null {
  const header = req.headers.get('authorization') ?? '';
  const match = /^Bearer\s+(.+)$/i.exec(header);
  return match ? match[1] : null;
}

/** Every API route needs a session, even a guest one. */
export async function requireUser(req: Request): Promise<RequestUser> {
  const user = await userFromToken(bearerToken(req));
  if (!user) throw new HttpError(401, 'Your session has expired. Please reload the page.');
  return user;
}
