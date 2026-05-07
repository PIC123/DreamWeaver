import { NextResponse, type NextRequest } from 'next/server';
import { getOpenAI } from '@/lib/openai';
import { env } from '@/lib/env';

export const runtime = 'nodejs';
export const maxDuration = 60;

type ImageBody = { prompt: string };

export async function POST(req: NextRequest) {
  let body: ImageBody;
  try {
    body = (await req.json()) as ImageBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const prompt = body.prompt?.trim();
  if (!prompt) {
    return NextResponse.json({ error: 'Missing "prompt"' }, { status: 400 });
  }

  try {
    const openai = getOpenAI();
    const response = await openai.images.generate({
      model: env.openAIImageModel,
      prompt,
    });
    const imageUrl = response.data?.[0]?.url ?? null;
    if (!imageUrl) {
      return NextResponse.json({ error: 'Image API returned no URL' }, { status: 502 });
    }
    return NextResponse.json({ imageUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
