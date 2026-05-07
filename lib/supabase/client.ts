'use client';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';

let cached: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (cached) return cached;
  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    if (typeof window !== 'undefined') {
      console.warn(
        'Supabase credentials missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.',
      );
    }
    // Fall through with empty strings; Supabase will fail with a clear error on first call.
  }
  cached = createClient(env.supabaseUrl ?? '', env.supabaseAnonKey ?? '', {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  return cached;
}
