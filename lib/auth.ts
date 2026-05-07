import { type NextRequest } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';

/**
 * Resolve the authenticated user (if any) for a server request.
 * Uses the Authorization header sent by the browser-side Supabase client.
 */
export async function getRequestUser(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (!auth) return { user: null, accessToken: null };

  const accessToken = auth.replace(/^Bearer\s+/i, '');
  const supabase = getSupabaseServer(accessToken);
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) return { user: null, accessToken };
  return { user: data.user, accessToken };
}
