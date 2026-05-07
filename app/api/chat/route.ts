import { NextResponse, type NextRequest } from 'next/server';
import { getOpenAI } from '@/lib/openai';
import { env } from '@/lib/env';
import { buildSystemPrompt, normalizeStoryTurn, storyTurnJsonSchema } from '@/lib/prompt';
import type { HistoryEntry } from '@/types/story';

export const runtime = 'nodejs';
export const maxDuration = 30;

type ChatBody = {
  setting: string;
  history?: HistoryEntry[];
  userInput?: string;
};

function toOpenAIMessages(history: HistoryEntry[]) {
  return history.map(([role, content]) => ({
    role: role === 'human' ? ('user' as const) : (role as 'system' | 'assistant'),
    content,
  }));
}

export async function POST(req: NextRequest) {
  let body: ChatBody;
  try {
    body = (await req.json()) as ChatBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const setting = body.setting?.trim();
  if (!setting) {
    return NextResponse.json({ error: 'Missing "setting"' }, { status: 400 });
  }

  const incomingHistory: HistoryEntry[] = Array.isArray(body.history) ? body.history : [];
  const history: HistoryEntry[] =
    incomingHistory.length > 0 ? incomingHistory : [['system', buildSystemPrompt(setting)]];

  const messages = toOpenAIMessages(history);
  if (body.userInput && body.userInput.trim()) {
    messages.push({ role: 'user', content: body.userInput.trim() });
  }

  try {
    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: env.openAIChatModel,
      messages,
      response_format: { type: 'json_schema', json_schema: storyTurnJsonSchema },
    });

    const raw = completion.choices[0]?.message?.content ?? '';
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return NextResponse.json(
        { error: 'Model returned invalid JSON', raw },
        { status: 502 },
      );
    }

    const turn = normalizeStoryTurn(parsed);
    return NextResponse.json({ turn });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const status =
      typeof (err as { status?: number })?.status === 'number'
        ? (err as { status: number }).status
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
