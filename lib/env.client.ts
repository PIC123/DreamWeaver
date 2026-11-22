// Values the browser may see. Next.js only inlines `process.env.NEXT_PUBLIC_*`
// when it is written out literally, so do not replace these with dynamic lookups.
export const clientEnv = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
};

export const isSupabaseConfigured = Boolean(clientEnv.supabaseUrl && clientEnv.supabaseAnonKey);
