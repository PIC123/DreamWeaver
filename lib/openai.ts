import OpenAI from 'openai';
import { requireEnv } from '@/lib/env';

let cached: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (cached) return cached;
  cached = new OpenAI({ apiKey: requireEnv('openAIApiKey') });
  return cached;
}
