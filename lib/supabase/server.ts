import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env, requireEnv } from '@/lib/env';

/**
 * Anon-key Supabase client for server use, bound to a caller's JWT (if any).
 * Use this when you want operations to run with the caller's RLS identity.
 */
export function getSupabaseServer(accessToken?: string | null): SupabaseClient {
  const url = requireEnv('supabaseUrl');
  const anon = requireEnv('supabaseAnonKey');
  return createClient(url, anon, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: accessToken
      ? { headers: { Authorization: `Bearer ${accessToken}` } }
      : undefined,
  });
}

/**
 * Service-role Supabase client. Bypasses RLS — use only for trusted server work
 * such as cascade-deleting Storage objects. NEVER ship to the browser.
 */
export function getSupabaseAdmin(): SupabaseClient {
  const url = requireEnv('supabaseUrl');
  const key = env.supabaseServiceRoleKey;
  if (!key) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not set. Required for admin server operations.',
    );
  }
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
