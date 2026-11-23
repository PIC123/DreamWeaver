import 'server-only';
import { clientEnv } from './env.client';

function read(...names: string[]): string | undefined {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  return undefined;
}

function readInt(name: string, fallback: number): number {
  const parsed = Number.parseInt(process.env[name] ?? '', 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

export class MissingEnvError extends Error {}

function required(label: string, ...names: string[]): string {
  const value = read(...names);
  if (!value) throw new MissingEnvError(`Server is missing ${label} (${names[0]}).`);
  return value;
}

export const serverEnv = {
  // These two are inlined at build time (see next.config.mjs), so reuse them.
  get supabaseUrl() {
    if (!clientEnv.supabaseUrl)
      throw new MissingEnvError('Server is missing NEXT_PUBLIC_SUPABASE_URL.');
    return clientEnv.supabaseUrl;
  },
  get supabaseAnonKey() {
    if (!clientEnv.supabaseAnonKey) {
      throw new MissingEnvError('Server is missing NEXT_PUBLIC_SUPABASE_ANON_KEY.');
    }
    return clientEnv.supabaseAnonKey;
  },
  get supabaseServiceKey() {
    return required(
      'the Supabase service role key',
      'SUPABASE_SERVICE_ROLE_KEY',
      'SUPABASE_SECRET_KEY',
    );
  },
  get openAIApiKey() {
    return required('the OpenAI API key', 'OPENAI_API_KEY');
  },
  openAIBaseUrl: read('OPENAI_BASE_URL'),
  textModel: read('OPENAI_TEXT_MODEL', 'OPENAI_CHAT_MODEL') ?? 'gpt-6-luna',
  textReasoningEffort: read('OPENAI_TEXT_REASONING_EFFORT') ?? 'low',
  imageModel: read('OPENAI_IMAGE_MODEL') ?? 'gpt-image-2.6-flare',
  imageQuality: read('OPENAI_IMAGE_QUALITY') ?? 'low',
  imageSize: read('OPENAI_IMAGE_SIZE') ?? '1024x1024',
  moderationEnabled: read('MODERATION') !== 'off',

  // Budgets per rolling 24 hours. One "turn" is one narration plus one illustration.
  quota: {
    guestTurns: readInt('QUOTA_GUEST_TURNS_PER_DAY', 25),
    memberTurns: readInt('QUOTA_MEMBER_TURNS_PER_DAY', 150),
    globalTurns: readInt('QUOTA_GLOBAL_TURNS_PER_DAY', 1500),
    userSettings: readInt('QUOTA_SETTINGS_PER_DAY', 40),
    globalSettings: readInt('QUOTA_GLOBAL_SETTINGS_PER_DAY', 3000),
    // One "portrait round" paints a set of options in the character creator.
    guestPortraits: readInt('QUOTA_GUEST_PORTRAIT_ROUNDS_PER_DAY', 3),
    memberPortraits: readInt('QUOTA_MEMBER_PORTRAIT_ROUNDS_PER_DAY', 10),
    globalPortraits: readInt('QUOTA_GLOBAL_PORTRAIT_ROUNDS_PER_DAY', 300),
  },
};
