import { NextResponse } from 'next/server';
import { getOpenAI } from '@/lib/openai';
import { env } from '@/lib/env';

export const runtime = 'nodejs';
export const maxDuration = 15;

const FALLBACKS = [
  'A mystical floating island above the clouds',
  'An underwater city of bioluminescent creatures',
  'A steampunk Victorian London with time portals',
  'An enchanted forest where seasons change every hour',
  'A space station at the edge of a black hole',
  'A medieval castle that exists in multiple dimensions',
  'A post-apocalyptic desert with ancient ruins',
  'A magical library where books come alive at night',
];

export async function POST() {
  try {
    const openai = getOpenAI();
    const response = await openai.chat.completions.create({
      model: env.openAIChatModel,
      max_tokens: 50,
      temperature: 1.2,
      messages: [
        {
          role: 'system',
          content:
            'You are a creative story setting generator. Generate unique, exciting, and imaginative story settings.',
        },
        {
          role: 'user',
          content:
            'Generate a single creative and exciting setting for a text-based adventure game. Make it unique, interesting, and immersive. It can be fantasy, sci-fi, historical, or any genre. Keep it to one short sentence (5-15 words). Just return the setting, nothing else.',
        },
      ],
    });
    const setting = response.choices[0]?.message?.content?.trim() ?? '';
    if (!setting) throw new Error('Empty setting');
    return NextResponse.json({ setting });
  } catch {
    const setting = FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)];
    return NextResponse.json({ setting, fallback: true });
  }
}
