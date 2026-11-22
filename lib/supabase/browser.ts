'use client';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { clientEnv, isSupabaseConfigured } from '@/lib/env.client';

let cached: SupabaseClient | null = null;

/** The browser's Supabase client. Throws a readable error if the app is not configured. */
export function getSupabase(): SupabaseClient {
  if (cached) return cached;
  if (!isSupabaseConfigured) {
    throw new Error(
      'DreamWeaver is not configured: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, then rebuild.',
    );
  }
  cached = createClient(clientEnv.supabaseUrl, clientEnv.supabaseAnonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
  return cached;
}
