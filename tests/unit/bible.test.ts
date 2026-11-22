import { describe, expect, it } from 'vitest';
import { EMPTY_BIBLE, mergeBible, normalizeBible, normalizeUpdate } from '@/lib/story/bible';

const update = (extra: Record<string, unknown> = {}) =>
  normalizeUpdate({
    summary: '',
    newCharacters: [],
    newPlaces: [],
    itemsGained: [],
    itemsLost: [],
    threads: [],
    ...extra,
  });

describe('mergeBible', () => {
  it('adds new characters and places but never changes an established look', () => {
    let bible = mergeBible(
      EMPTY_BIBLE,
      update({
        summary: 'Arrived.',
        newCharacters: [{ name: 'You', role: 'traveller', appearance: 'yellow raincoat' }],
        newPlaces: [{ name: 'Harbour', appearance: 'grey stone quay' }],
      }),
    );
    bible = mergeBible(
      bible,
      update({
        summary: 'Met a gull.',
        newCharacters: [
          { name: 'YOU', role: 'wizard', appearance: 'purple cloak' },
          { name: 'Old Gull', role: 'keeper', appearance: 'blue cap' },
        ],
        newPlaces: [{ name: 'harbour', appearance: 'golden beach' }],
      }),
    );
    expect(bible.summary).toBe('Met a gull.');
    expect(bible.characters).toEqual([
      { name: 'You', role: 'traveller', appearance: 'yellow raincoat' },
      { name: 'Old Gull', role: 'keeper', appearance: 'blue cap' },
    ]);
    expect(bible.places).toEqual([{ name: 'Harbour', appearance: 'grey stone quay' }]);
  });

  it('adds and removes carried items by name, ignoring case', () => {
    let bible = mergeBible(
      EMPTY_BIBLE,
      update({ itemsGained: [{ name: 'Brass key', description: 'cold' }, { name: 'Lamp' }] }),
    );
    bible = mergeBible(
      bible,
      update({ itemsGained: [{ name: 'brass key' }], itemsLost: ['LAMP'] }),
    );
    expect(bible.items).toEqual([{ name: 'Brass key', description: 'cold' }]);
  });

  it('keeps the old summary and threads when a turn reports none', () => {
    const before = { ...EMPTY_BIBLE, summary: 'So far.', threads: ['Find the lamp'] };
    expect(mergeBible(before, update())).toMatchObject({
      summary: 'So far.',
      threads: ['Find the lamp'],
    });
    expect(mergeBible(before, update({ threads: ['Escape'] })).threads).toEqual(['Escape']);
  });

  it('caps how much it will remember', () => {
    const many = Array.from({ length: 30 }, (_, i) => ({ name: `Person ${i}`, appearance: 'x' }));
    const bible = mergeBible(
      EMPTY_BIBLE,
      update({ newCharacters: many, threads: many.map((m) => m.name) }),
    );
    expect(bible.characters).toHaveLength(12);
    expect(bible.threads).toHaveLength(5);
  });
});

describe('normalizeBible', () => {
  it('turns anything stored into a well-formed bible', () => {
    expect(normalizeBible(null)).toEqual(EMPTY_BIBLE);
    expect(normalizeBible({})).toEqual(EMPTY_BIBLE);
    expect(
      normalizeBible({
        summary: '  spaced   out ',
        characters: [{ name: ' Ann ' }, { appearance: 'no name' }, 'junk'],
        items: 'not a list',
        threads: ['a', '', 3],
      }),
    ).toEqual({
      summary: 'spaced out',
      characters: [{ name: 'Ann', role: '', appearance: '' }],
      places: [],
      items: [],
      threads: ['a'],
    });
  });
});
