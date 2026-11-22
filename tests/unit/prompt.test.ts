import { describe, expect, it } from 'vitest';
import { EMPTY_BIBLE, type StoryBible } from '@/lib/story/bible';
import {
  OPENING_INSTRUCTION,
  buildImagePrompt,
  buildMessages,
  buildSceneBrief,
  parseTurn,
} from '@/lib/story/prompt';

describe('buildMessages', () => {
  it('opens a new story with the system prompt and the opening instruction', () => {
    const messages = buildMessages('A cloud city', [], 'ignored for the opening', EMPTY_BIBLE);
    expect(messages.map((m) => m.role)).toEqual(['system', 'user']);
    expect(messages[0].content).toContain('"A cloud city"');
    expect(messages[1].content).toBe(OPENING_INSTRUCTION);
  });

  it('replays scenes as alternating turns and ends with the new action', () => {
    const messages = buildMessages(
      'A cloud city',
      [
        { action: null, narration: 'Clouds drift by.' },
        { action: 'Jump', narration: 'You land softly.' },
      ],
      'Look down',
      EMPTY_BIBLE,
    );
    expect(messages.map((m) => [m.role, m.content]).slice(1)).toEqual([
      ['user', OPENING_INSTRUCTION],
      ['assistant', 'Clouds drift by.'],
      ['user', 'Jump'],
      ['assistant', 'You land softly.'],
      ['user', 'Look down'],
    ]);
  });

  it('keeps long stories within a bounded context', () => {
    const scenes = Array.from({ length: 40 }, (_, i) => ({
      action: `act ${i}`,
      narration: `scene ${i}`,
    }));
    const messages = buildMessages('x', scenes, 'next', EMPTY_BIBLE);
    expect(messages.length).toBe(1 + 1 + 24 * 2 + 1);
    expect(messages[1].content).toContain('16 scenes in');
    expect(messages.at(-1)!.content).toBe('next');
    expect(messages.at(-2)!.content).toBe('scene 39');
  });
});

describe('parseTurn', () => {
  it('tidies choices and trims text', () => {
    const turn = parseTurn(
      JSON.stringify({
        narration: '  A door.  ',
        choices: ['open_door', '  Look   around ', '', 7],
        imagePrompt: ' A red door ',
      }),
    );
    expect(turn).toMatchObject({
      narration: 'A door.',
      choices: ['open door', 'Look around'],
      imagePrompt: 'A red door',
    });
  });

  it('falls back to the narration when there is no image prompt', () => {
    expect(parseTurn('{"narration":"A door.","choices":[]}').imagePrompt).toBe('A door.');
  });

  it('rejects empty or broken output', () => {
    expect(() => parseTurn('{"narration":"","choices":[]}')).toThrow();
    expect(() => parseTurn('{"narration":"cut off')).toThrow();
  });
});

describe('buildImagePrompt', () => {
  it('leads with the house style and includes the setting', () => {
    const prompt = buildImagePrompt('A cloud city', 'A girl on a balcony');
    expect(prompt.startsWith('Watercolor storybook illustration')).toBe(true);
    expect(prompt).toContain('A cloud city');
    expect(prompt).toContain('A girl on a balcony');
  });
});

const bible: StoryBible = {
  summary: 'You reached the lighthouse.',
  characters: [
    { name: 'You', role: 'the traveller', appearance: 'a child in a yellow raincoat' },
    { name: 'Old Gull', role: 'keeper', appearance: 'a grey gull in a blue cap' },
    { name: 'Mara', role: 'baker', appearance: 'a tall woman with flour on her apron' },
  ],
  places: [{ name: 'The Lighthouse', appearance: 'a white tower with a green door' }],
  items: [{ name: 'Brass key', description: 'cold' }],
  threads: ['Find the lamp'],
};

describe('the story bible in prompts', () => {
  it('gives the narrator the bible and, with a summary, replays fewer scenes', () => {
    const scenes = Array.from({ length: 20 }, (_, i) => ({ action: `a${i}`, narration: `s${i}` }));
    const messages = buildMessages('x', scenes, 'next', bible);
    expect(messages[0].content).toContain('STORY BIBLE');
    expect(messages[0].content).toContain('Old Gull (keeper): a grey gull in a blue cap');
    expect(messages[0].content).toContain('The reader is carrying: Brass key (cold)');
    expect(messages.length).toBe(1 + 1 + 8 * 2 + 1);
  });

  it('gives the illustrator the fixed looks of who and what is in the picture', () => {
    const turn = parseTurn(
      JSON.stringify({
        narration: 'The gull nods.',
        choices: [],
        imagePrompt: 'Old Gull greets the traveller at The Lighthouse.',
        featuring: ['you', 'Old Gull'],
      }),
    );
    const brief = buildSceneBrief(bible, turn);
    expect(brief).toContain('- The main character: a child in a yellow raincoat');
    expect(brief).toContain('- Old Gull: a grey gull in a blue cap');
    // Named in the scene text though not in `featuring`.
    expect(brief).toContain('- The Lighthouse: a white tower with a green door');
    expect(brief).not.toContain('Mara');
  });

  it('shows the main character when the narrator names nobody', () => {
    const turn = parseTurn('{"narration":"Fog rolls in.","choices":[],"imagePrompt":"Fog."}');
    expect(turn.featuring).toEqual(['You']);
    expect(buildSceneBrief(bible, turn)).toContain('a child in a yellow raincoat');
  });
});
