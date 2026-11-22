import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { serverEnv } from '@/lib/env.server';

const serverAuth = { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false };

let admin: SupabaseClient | null = null;
let anon: SupabaseClient | null = null;

/** Service-role client. Bypasses row level security; never import this into client code. */
export function getAdmin(): SupabaseClient {
  admin ??= createClient(serverEnv.supabaseUrl, serverEnv.supabaseServiceKey, { auth: serverAuth });
  return admin;
}

/** Anon-key client for verifying tokens and reading what any visitor may read. */
export function getAnon(): SupabaseClient {
  anon ??= createClient(serverEnv.supabaseUrl, serverEnv.supabaseAnonKey, { auth: serverAuth });
  return anon;
}
