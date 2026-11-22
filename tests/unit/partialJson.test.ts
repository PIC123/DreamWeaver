import { describe, expect, it } from 'vitest';
import { readPartialString } from '@/lib/story/partialJson';

describe('readPartialString', () => {
  it('returns null until the field has started', () => {
    expect(readPartialString('', 'narration')).toBeNull();
    expect(readPartialString('{"narr', 'narration')).toBeNull();
    expect(readPartialString('{"narration"', 'narration')).toBeNull();
    expect(readPartialString('{"narration": ', 'narration')).toBeNull();
  });

  it('returns the text received so far', () => {
    expect(readPartialString('{"narration":"', 'narration')).toBe('');
    expect(readPartialString('{"narration":"You wa', 'narration')).toBe('You wa');
    expect(readPartialString('{ "narration" : "Done." , "choices": [', 'narration')).toBe('Done.');
  });

  it('decodes escapes and never emits half of one', () => {
    expect(readPartialString('{"narration":"She said \\"hi\\"\\nBye', 'narration')).toBe(
      'She said "hi"\nBye',
    );
    expect(readPartialString('{"narration":"line\\', 'narration')).toBe('line');
    expect(readPartialString('{"narration":"caf\\u00e9', 'narration')).toBe('café');
    expect(readPartialString('{"narration":"caf\\u00', 'narration')).toBe('caf');
  });

  it('keeps surrogate pairs together', () => {
    expect(readPartialString('{"narration":"star \\ud83c', 'narration')).toBe('star ');
    expect(readPartialString('{"narration":"star \\ud83c\\udf1f!', 'narration')).toBe('star 🌟!');
  });

  it('only grows as more of the stream arrives', () => {
    const full = JSON.stringify({
      narration: 'A "quoted" line ✨\nand another — with \\ slashes.',
      choices: ['a'],
    });
    let previous = '';
    for (let i = 0; i <= full.length; i++) {
      const now = readPartialString(full.slice(0, i), 'narration') ?? '';
      expect(now.startsWith(previous)).toBe(true);
      previous = now;
    }
    expect(previous).toBe('A "quoted" line ✨\nand another — with \\ slashes.');
  });
});
