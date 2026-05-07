/**
 * Centralised env access. Falls back to legacy CRA-style names so that
 * existing Vercel env vars keep working during the migration.
 */

function pick(...names: string[]): string | undefined {
  for (const name of names) {
    const value = process.env[name];
    if (value && value.trim().length > 0) return value;
  }
  return undefined;
}

export const env = {
  // Public (browser-safe)
  supabaseUrl: pick('NEXT_PUBLIC_SUPABASE_URL', 'REACT_APP_SUPABASE_URL'),
  supabaseAnonKey: pick('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'REACT_APP_SUPABASE_ANON_KEY'),

  // Server-only
  supabaseServiceRoleKey: pick('SUPABASE_SERVICE_ROLE_KEY'),
  openAIApiKey: pick('OPENAI_API_KEY'),
  openAIChatModel: pick('OPENAI_CHAT_MODEL') ?? 'gpt-4o-mini',
  openAIImageModel: pick('OPENAI_IMAGE_MODEL') ?? 'dall-e-3',
  elevenLabsApiKey: pick('ELEVENLABS_API_KEY'),
  allowedImageHost: pick('ALLOWED_IMAGE_HOST') ?? 'oaidalleapiprodscus.blob.core.windows.net',
};

export function requireEnv<K extends keyof typeof env>(key: K): NonNullable<(typeof env)[K]> {
  const value = env[key];
  if (!value) {
    throw new Error(`Missing required env var: ${String(key)}`);
  }
  return value as NonNullable<(typeof env)[K]>;
}
