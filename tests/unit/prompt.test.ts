import { describe, expect, it } from 'vitest';
import {
  OPENING_INSTRUCTION,
  buildImagePrompt,
  buildMessages,
  parseTurn,
} from '@/lib/story/prompt';

describe('buildMessages', () => {
  it('opens a new story with the system prompt and the opening instruction', () => {
    const messages = buildMessages('A cloud city', [], 'ignored for the opening');
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
    const messages = buildMessages('x', scenes, 'next');
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
    expect(turn).toEqual({
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
