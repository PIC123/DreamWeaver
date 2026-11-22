import 'server-only';
import OpenAI from 'openai';
import { serverEnv } from '@/lib/env.server';
import { readPartialString } from '@/lib/story/partialJson';
import { parseTurn, turnJsonSchema } from '@/lib/story/prompt';
import type { Turn } from '@/lib/story/types';
import { HttpError } from './http';

let client: OpenAI | null = null;

function openai(): OpenAI {
  client ??= new OpenAI({
    apiKey: serverEnv.openAIApiKey,
    baseURL: serverEnv.openAIBaseUrl,
    maxRetries: 1,
  });
  return client;
}

type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };
type Effort = NonNullable<OpenAI.Chat.ChatCompletionCreateParams['reasoning_effort']>;

function reasoning(): { reasoning_effort?: Effort } {
  const effort = serverEnv.textReasoningEffort;
  return effort === 'default' ? {} : { reasoning_effort: effort as Effort };
}

/** Rejects text that OpenAI's free moderation model flags. Fails open if the check itself errors. */
export async function assertAllowed(text: string): Promise<void> {
  if (!serverEnv.moderationEnabled || !text.trim()) return;
  let flagged = false;
  try {
    const res = await openai().moderations.create({ model: 'omni-moderation-latest', input: text });
    flagged = res.results.some((r) => r.flagged);
  } catch (err) {
    console.warn('Moderation check failed; continuing.', err);
  }
  if (flagged) {
    throw new HttpError(400, "Let's keep this story friendly for everyone. Try a different idea.");
  }
}

/** Asks the storyteller for the next turn, reporting narration text as it arrives. */
export async function streamTurn(
  messages: ChatMessage[],
  onNarration: (delta: string) => void,
): Promise<Turn> {
  const stream = await openai().chat.completions.create({
    model: serverEnv.textModel,
    messages,
    response_format: { type: 'json_schema', json_schema: turnJsonSchema },
    max_completion_tokens: 2000,
    stream: true,
    ...reasoning(),
  });

  let raw = '';
  let sent = 0;
  for await (const chunk of stream) {
    const piece = chunk.choices[0]?.delta?.content;
    if (!piece) continue;
    raw += piece;
    const narration = readPartialString(raw, 'narration');
    if (narration && narration.length > sent) {
      onNarration(narration.slice(sent));
      sent = narration.length;
    }
  }
  return parseTurn(raw);
}

/** Paints one illustration and returns it as WebP bytes. */
export async function paintScene(prompt: string): Promise<Buffer> {
  const res = await openai().images.generate(
    {
      model: serverEnv.imageModel,
      prompt,
      size: serverEnv.imageSize,
      quality: serverEnv.imageQuality as OpenAI.Images.ImageGenerateParams['quality'],
      output_format: 'webp',
      output_compression: 80,
    },
    // Give up before the serverless function itself is cut off, so the reader gets a clear error.
    { timeout: 50_000, maxRetries: 0 },
  );
  const b64 = res.data?.[0]?.b64_json;
  if (!b64) throw new Error('Image API returned no image data.');
  return Buffer.from(b64, 'base64');
}

export const FALLBACK_SETTINGS = [
  'A mystical floating island above the clouds',
  'An underwater city of bioluminescent creatures',
  'A steampunk London with doors that open onto other centuries',
  'An enchanted forest where the seasons change every hour',
  'A lighthouse at the edge of the world, tended by a talking gull',
  'A castle that rearranges its rooms every night',
  'A desert caravan following a map drawn in starlight',
  'A library where the books come alive after midnight',
  'A night market that only appears when it rains',
  'A tiny village built inside a giant sleeping clock',
];

export async function inventSetting(): Promise<string> {
  const res = await openai().chat.completions.create({
    model: serverEnv.textModel,
    max_completion_tokens: 600,
    messages: [
      {
        role: 'system',
        content:
          'You invent settings for all-ages illustrated adventure stories. Reply with one setting only: a single evocative phrase of 5 to 15 words, no quotation marks, no full stop.',
      },
      { role: 'user', content: 'Give me a fresh, surprising setting.' },
    ],
    ...reasoning(),
  });
  const setting = res.choices[0]?.message?.content?.trim().replace(/^["']|["'.]$/g, '');
  if (!setting) throw new Error('Empty setting');
  return setting.slice(0, 200);
}
