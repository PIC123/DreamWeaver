import type { StoryTurn } from '@/types/story';

export function buildSystemPrompt(setting: string): string {
  return [
    `Act as a terminal for a Zork-style text-based dungeon adventure game set in: ${setting}.`,
    'Respond ONLY with descriptions of the environment and react to basic commands like moving in a direction or picking up items.',
    'Begin the story in a randomly generated space and describe what the player sees.',
    'Always return a JSON object that matches the schema you have been given.',
    'For the dallEPrompt field, always start with: "Watercolor storybook illustration in a whimsical hand-painted style, warm lighting, soft edges, children\'s book aesthetic, detailed and charming," followed by the scene description with rich visual details.',
    'For possibleActions: use natural language with proper spacing, NOT underscores or snake_case (e.g. "Open the door" not "open_door").',
  ].join(' ');
}

/**
 * JSON Schema passed to OpenAI structured outputs.
 * Field names use camelCase here; we reshape the legacy hyphenated keys at the boundary.
 */
export const storyTurnJsonSchema = {
  name: 'story_turn',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      storyText: { type: 'string', description: 'Narrative text shown to the player.' },
      possibleActions: {
        type: 'array',
        items: { type: 'string' },
        minItems: 2,
        maxItems: 6,
      },
      location: {
        type: 'object',
        additionalProperties: false,
        properties: {
          x: { type: 'integer' },
          y: { type: 'integer' },
        },
        required: ['x', 'y'],
      },
      dallEPrompt: { type: 'string', description: 'Watercolor-storybook prompt for image gen.' },
    },
    required: ['storyText', 'possibleActions', 'location', 'dallEPrompt'],
  },
} as const;

/** Best-effort coercion when legacy hyphenated payloads come back. */
export function normalizeStoryTurn(raw: unknown): StoryTurn {
  const obj = (raw ?? {}) as Record<string, unknown>;
  const get = (a: string, b: string) => obj[a] ?? obj[b];
  const loc = (get('location', 'location') as { x?: unknown; y?: unknown } | undefined) ?? undefined;
  return {
    storyText: String(get('storyText', 'story-text') ?? ''),
    possibleActions: ((get('possibleActions', 'possible-actions') as unknown[]) ?? []).map(String),
    dallEPrompt: String(get('dallEPrompt', 'dall-e-prompt') ?? ''),
    location:
      loc && typeof loc.x === 'number' && typeof loc.y === 'number'
        ? { x: loc.x, y: loc.y }
        : undefined,
  };
}
