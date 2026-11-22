/**
 * The story bible: what the narrator and the illustrator must stay consistent
 * with. The narrator proposes small updates each turn; `mergeBible` applies
 * them under rules that keep established facts stable.
 */

export type BibleCharacter = { name: string; role: string; appearance: string };
export type BiblePlace = { name: string; appearance: string };
export type BibleItem = { name: string; description: string };

export type StoryBible = {
  /** A short running summary of everything that has happened. */
  summary: string;
  characters: BibleCharacter[];
  places: BiblePlace[];
  /** What the reader is carrying. */
  items: BibleItem[];
  /** Open questions and goals the story has raised. */
  threads: string[];
};

/** What the narrator returns each turn. */
export type BibleUpdate = {
  summary: string;
  newCharacters: BibleCharacter[];
  newPlaces: BiblePlace[];
  itemsGained: BibleItem[];
  itemsLost: string[];
  threads: string[];
};

export const EMPTY_BIBLE: StoryBible = {
  summary: '',
  characters: [],
  places: [],
  items: [],
  threads: [],
};

/** The name the narrator uses for the reader's own character. */
export const HERO_NAME = 'You';

const CAPS = { characters: 12, places: 12, items: 12, threads: 5 } as const;
const MAX = { name: 60, short: 160, appearance: 320, summary: 1200 } as const;

const text = (value: unknown, max: number): string =>
  typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : '';

const list = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);
const record = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

export const sameName = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

function character(value: unknown): BibleCharacter | null {
  const v = record(value);
  const name = text(v.name, MAX.name);
  return name
    ? { name, role: text(v.role, MAX.short), appearance: text(v.appearance, MAX.appearance) }
    : null;
}

function place(value: unknown): BiblePlace | null {
  const v = record(value);
  const name = text(v.name, MAX.name);
  return name ? { name, appearance: text(v.appearance, MAX.appearance) } : null;
}

function item(value: unknown): BibleItem | null {
  const v = record(value);
  const name = text(v.name, MAX.name);
  return name ? { name, description: text(v.description, MAX.short) } : null;
}

const present = <T>(value: T | null): value is T => value !== null;

function uniqueByName<T extends { name: string }>(entries: T[], cap: number): T[] {
  const out: T[] = [];
  for (const entry of entries) {
    if (!out.some((kept) => sameName(kept.name, entry.name))) out.push(entry);
  }
  return out.slice(0, cap);
}

/** Tidies whatever is stored in the database into a well-formed bible. */
export function normalizeBible(value: unknown): StoryBible {
  const v = record(value);
  return {
    summary: text(v.summary, MAX.summary),
    characters: uniqueByName(list(v.characters).map(character).filter(present), CAPS.characters),
    places: uniqueByName(list(v.places).map(place).filter(present), CAPS.places),
    items: uniqueByName(list(v.items).map(item).filter(present), CAPS.items),
    threads: list(v.threads)
      .map((t) => text(t, MAX.short))
      .filter(Boolean)
      .slice(0, CAPS.threads),
  };
}

/** Tidies the narrator's raw output into a well-formed update. */
export function normalizeUpdate(value: unknown): BibleUpdate {
  const v = record(value);
  return {
    summary: text(v.summary, MAX.summary),
    newCharacters: list(v.newCharacters).map(character).filter(present),
    newPlaces: list(v.newPlaces).map(place).filter(present),
    itemsGained: list(v.itemsGained).map(item).filter(present),
    itemsLost: list(v.itemsLost)
      .map((n) => text(n, MAX.name))
      .filter(Boolean),
    threads: list(v.threads)
      .map((t) => text(t, MAX.short))
      .filter(Boolean),
  };
}

/**
 * Applies a turn's update. Characters and places are append-only: once someone
 * or somewhere has a look, it never changes, which is what keeps the pictures
 * consistent. The summary and threads are replaced; items come and go.
 */
export function mergeBible(bible: StoryBible, update: BibleUpdate): StoryBible {
  const kept = bible.items.filter(
    (owned) => !update.itemsLost.some((lost) => sameName(lost, owned.name)),
  );
  return {
    summary: update.summary || bible.summary,
    characters: uniqueByName([...bible.characters, ...update.newCharacters], CAPS.characters),
    places: uniqueByName([...bible.places, ...update.newPlaces], CAPS.places),
    items: uniqueByName([...kept, ...update.itemsGained], CAPS.items),
    threads: (update.threads.length ? update.threads : bible.threads).slice(0, CAPS.threads),
  };
}

export const isEmptyBible = (bible: StoryBible) =>
  !bible.summary && bible.characters.length === 0 && bible.places.length === 0;

/** The bible as the narrator reads it at the start of each turn. */
export function describeBible(bible: StoryBible): string {
  const lines: string[] = ['STORY BIBLE (established facts; stay consistent with all of it)'];
  lines.push(`Summary so far: ${bible.summary || '(the story is just beginning)'}`);
  lines.push('Characters:');
  if (bible.characters.length === 0) lines.push('  (none yet)');
  for (const c of bible.characters) {
    lines.push(`  - ${c.name}${c.role ? ` (${c.role})` : ''}: ${c.appearance || 'no look set'}`);
  }
  lines.push('Places:');
  if (bible.places.length === 0) lines.push('  (none yet)');
  for (const p of bible.places) lines.push(`  - ${p.name}: ${p.appearance || 'no look set'}`);
  lines.push(
    `The reader is carrying: ${
      bible.items.length
        ? bible.items
            .map((i) => (i.description ? `${i.name} (${i.description})` : i.name))
            .join('; ')
        : 'nothing'
    }`,
  );
  lines.push(`Open threads: ${bible.threads.length ? bible.threads.join('; ') : '(none yet)'}`);
  return lines.join('\n');
}

/**
 * The looks an illustrator needs for one picture: the named characters and
 * places, falling back to whoever the scene's own text mentions.
 */
export function castFor(bible: StoryBible, featuring: string[], sceneText: string): string {
  const mentioned = (name: string) =>
    featuring.some((f) => sameName(f, name)) ||
    (!sameName(name, HERO_NAME) && sceneText.toLowerCase().includes(name.toLowerCase()));

  const characters = bible.characters.filter((c) => c.appearance && mentioned(c.name));
  const places = bible.places.filter((p) => p.appearance && mentioned(p.name));
  if (characters.length === 0 && places.length === 0) return '';

  const lines: string[] = [];
  if (characters.length) {
    lines.push('Recurring characters (draw each exactly as described, every time):');
    for (const c of characters) {
      const who = sameName(c.name, HERO_NAME) ? 'The main character' : c.name;
      lines.push(`- ${who}: ${c.appearance}`);
    }
  }
  if (places.length) {
    lines.push('Recurring places (keep their look the same):');
    for (const p of places) lines.push(`- ${p.name}: ${p.appearance}`);
  }
  return lines.join('\n');
}
