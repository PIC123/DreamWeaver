/**
 * The hidden story plan and pacing. A narrator that only ever writes "what
 * happens next" resolves trouble early and tells the same story twice. So each
 * story gets a loose plan up front, the application (not the model) picks the
 * ingredients that make stories differ, and the application counts scenes and
 * tells the narrator where in the story it is.
 *
 * The plan is never shown to the reader: it holds the secret's answer.
 */

import type { ReadingLevel } from './options';

export type Rng = () => number;

// ── ingredients chosen by code, for variety ─────────────────────────────────

export const ARC_SHAPES = {
  rise: 'a steady climb: things start hard and get better step by hard-won step',
  'fall-rise': 'a fall then a rise: things get worse, reach a lowest moment, then turn around',
  'rise-fall-rise':
    'a false victory: early success, then a serious reversal, then a harder-earned win',
  'steady-twist':
    'a gentle journey with a surprise: calm discovery, then one twist that changes what it all meant, then everything fitting together',
} as const;
export type ArcShape = keyof typeof ARC_SHAPES;

const TONES: Record<ReadingLevel, string[]> = {
  early: ['cosy and funny', 'silly and warm', 'gentle and full of wonder', 'playful and brave'],
  family: [
    'warm and adventurous',
    'funny with real heart',
    'mysterious but friendly',
    'wondrous and a little spooky',
    'fast and daring',
    'quiet and magical',
  ],
  advanced: [
    'wry and bittersweet',
    'eerie and atmospheric',
    'tense, with moral grey areas',
    'melancholy and beautiful',
    'sharp-witted and satirical',
    'a slow-burning mystery',
    'heartfelt, with something really at stake',
  ],
};

const COMPLICATIONS = [
  'something precious is lost or broken',
  'a rival wants the same thing',
  'a promise that is hard to keep',
  'time is running out',
  'a misunderstanding between friends',
  'a rule that must be bent or obeyed',
  'help arrives from someone who cannot be fully trusted',
  'the obvious solution makes things worse',
  'the hero is mistaken for someone else',
  'two good things cannot both be saved',
  'a secret someone is keeping out of kindness',
  'the way home is closed',
];

const INGREDIENTS = [
  'a map with one deliberate mistake',
  'an instrument that plays only one note',
  'a door that is only there at dusk',
  'a recipe with a missing line',
  'a very small, very stubborn animal',
  'a shadow that points the wrong way',
  'a letter delivered many years late',
  'a clock that runs on something other than time',
  'a bridge nobody remembers building',
  'a jar of weather',
  'a tune everyone half remembers',
  'a key that fits nothing nearby',
  'a festival held for a forgotten reason',
  'a lighthouse far from any sea',
  'a garden that grows at night',
  'a market stall that sells borrowed things',
];

// A broad pool, so the narrator does not reach for the same few names every time.
const NAMES = [
  'Amara',
  'Bao',
  'Cosima',
  'Dariusz',
  'Esperanza',
  'Farid',
  'Greta',
  'Hoku',
  'Ines',
  'Jomo',
  'Kalinda',
  'Lorcan',
  'Mirembe',
  'Nilufar',
  'Oskar',
  'Paloma',
  'Quentin',
  'Rangi',
  'Saoirse',
  'Tavita',
  'Ulla',
  'Vikram',
  'Wren',
  'Xiadani',
  'Yusuf',
  'Zofia',
  'Anselm',
  'Birdie',
  'Calloway',
  'Delphine',
  'Eamon',
  'Fenna',
  'Gideon',
  'Halima',
  'Ignatius',
  'Juniper',
  'Kofi',
  'Linnea',
  'Marlowe',
  'Noor',
  'Odalys',
  'Pim',
  'Rosalind',
  'Soren',
  'Tamsin',
  'Umberto',
  'Vesna',
  'Wilf',
];

/** Roughly how many scenes a story of each level should run before it lands. */
const TARGET_SCENES: Record<ReadingLevel, [number, number]> = {
  early: [6, 8],
  family: [9, 12],
  advanced: [11, 15],
};

export type StorySeeds = {
  arc: ArcShape;
  tone: string;
  complication: string;
  ingredient: string;
  names: string[];
  targetScenes: number;
};

const pick = <T>(items: readonly T[], rng: Rng): T => items[Math.floor(rng() * items.length)];

function sample<T>(items: readonly T[], count: number, rng: Rng): T[] {
  const pool = [...items];
  const out: T[] = [];
  while (out.length < count && pool.length) {
    out.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  }
  return out;
}

/** Rolls the dice for one story. Pass a seeded `rng` to make it repeatable. */
export function rollSeeds(level: ReadingLevel, rng: Rng = Math.random): StorySeeds {
  const [min, max] = TARGET_SCENES[level];
  return {
    arc: pick(Object.keys(ARC_SHAPES) as ArcShape[], rng),
    tone: pick(TONES[level], rng),
    complication: pick(COMPLICATIONS, rng),
    ingredient: pick(INGREDIENTS, rng),
    names: sample(NAMES, 5, rng),
    targetScenes: min + Math.floor(rng() * (max - min + 1)),
  };
}

// ── the plan ────────────────────────────────────────────────────────────────

/** What the planning call writes, given the setting and the seeds. */
export type PlanDraft = {
  /** What the reader's character wants. */
  want: string;
  /** What is lost if they fail. */
  stake: string;
  /** Who or what stands in the way, and what it wants. */
  opposition: string;
  /** Troubles waiting to happen, in the order they should arrive. */
  complications: string[];
  /** A question the story raises early... */
  secret: string;
  /** ...and its answer, decided now so the story can keep its promise. */
  secretAnswer: string;
  /** The question the reader's choices keep testing, e.g. "safety or kindness?" */
  theme: string;
};

export type StoryPlan = StorySeeds & PlanDraft;

export const planJsonSchema = {
  name: 'story_plan',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      want: { type: 'string' },
      stake: { type: 'string' },
      opposition: { type: 'string' },
      complications: { type: 'array', items: { type: 'string' } },
      secret: { type: 'string' },
      secretAnswer: { type: 'string' },
      theme: { type: 'string' },
    },
    required: ['want', 'stake', 'opposition', 'complications', 'secret', 'secretAnswer', 'theme'],
  },
} as const;

const line = (value: unknown, max = 240): string =>
  typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : '';

/** Tidies the planning call's output. Missing parts are simply left empty. */
export function normalizeDraft(value: unknown): PlanDraft {
  const v = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>;
  return {
    want: line(v.want),
    stake: line(v.stake),
    opposition: line(v.opposition),
    complications: (Array.isArray(v.complications) ? v.complications : [])
      .map((c) => line(c))
      .filter(Boolean)
      .slice(0, 3),
    secret: line(v.secret),
    secretAnswer: line(v.secretAnswer),
    theme: line(v.theme, 120),
  };
}

const EMPTY_DRAFT: PlanDraft = {
  want: '',
  stake: '',
  opposition: '',
  complications: [],
  secret: '',
  secretAnswer: '',
  theme: '',
};

/** A plan with the code-chosen ingredients only, for when planning fails. */
export const seedsOnlyPlan = (seeds: StorySeeds): StoryPlan => ({ ...seeds, ...EMPTY_DRAFT });

/** Restores a stored plan, tolerating anything missing or malformed. */
export function normalizePlan(value: unknown, level: ReadingLevel): StoryPlan {
  const v = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>;
  const fallback = rollSeeds(level);
  const target = Number(v.targetScenes);
  return {
    arc: typeof v.arc === 'string' && v.arc in ARC_SHAPES ? (v.arc as ArcShape) : fallback.arc,
    tone: line(v.tone, 80) || fallback.tone,
    complication: line(v.complication, 120) || fallback.complication,
    ingredient: line(v.ingredient, 120) || fallback.ingredient,
    names: (Array.isArray(v.names) ? v.names : []).map((n) => line(n, 40)).filter(Boolean),
    targetScenes:
      Number.isFinite(target) && target >= 4 && target <= 60 ? target : fallback.targetScenes,
    ...normalizeDraft(v),
  };
}

/** The instructions for the one-off planning call. */
export function buildPlanMessages(input: {
  setting: string;
  level: ReadingLevel;
  seeds: StorySeeds;
  heroLook: string | null;
}): { role: 'system' | 'user'; content: string }[] {
  const audience = {
    early:
      'a child of five to seven. Keep the problem small, concrete and never truly frightening: a lost thing, a mix-up, a job that keeps going funnily wrong.',
    family: 'a family reading together. A real problem with gentle peril, humour and heart.',
    advanced:
      'teenagers and adults. Give it a real dilemma with no cost-free answer, an opponent with an understandable reason, and room for irony, loss or ambiguity. Nothing graphic.',
  }[input.level];

  return [
    {
      role: 'system',
      content: [
        'You plan interactive illustrated stories. You are writing private notes for the narrator, who will improvise the story one short scene at a time while a reader makes the choices. The reader never sees these notes.',
        `Plan for ${audience}`,
        'Write a loose plan, not an outline: the reader will take the story in directions you cannot predict, so describe forces and troubles, not a sequence of scenes.',
        '"want": what the reader\'s character wants, concretely. "stake": what is lost if they fail; make it matter to this audience.',
        '"opposition": who or what stands in the way and what it wants. Prefer a force with its own reasons over a simple villain.',
        '"complications": exactly three troubles waiting to happen, each one sentence, each worse or stranger than the last. They must come from the setting and the opposition, never from coincidence.',
        '"secret": one intriguing question the opening can raise. "secretAnswer": its answer, decided now. The answer should be surprising yet make sense of earlier events, and should matter to how the story can end.',
        '"theme": a short question that the reader\'s choices can keep testing, such as "safety or kindness?" It must never be stated in the story.',
        'Use the given ingredients. Avoid the first idea that comes to mind: no chosen ones, no prophecies, no "it was all a dream", no glowing crystals or mysterious hooded strangers.',
      ].join(' '),
    },
    {
      role: 'user',
      content: [
        `Setting: ${input.setting}`,
        input.heroLook ? `The reader's character: ${input.heroLook}` : null,
        `Emotional shape: ${ARC_SHAPES[input.seeds.arc]}`,
        `Tone: ${input.seeds.tone}`,
        `A trouble to build on: ${input.seeds.complication}`,
        `An unusual ingredient to work in: ${input.seeds.ingredient}`,
        `Length: about ${input.seeds.targetScenes} short scenes`,
      ]
        .filter(Boolean)
        .join('\n'),
    },
  ];
}

/** The plan as the narrator reads it each turn. */
export function describePlan(plan: StoryPlan): string {
  const lines = ['STORY PLAN (private notes; never reveal or quote these to the reader)'];
  lines.push(`Tone: ${plan.tone}. Emotional shape: ${ARC_SHAPES[plan.arc]}.`);
  if (plan.want) lines.push(`The reader's character wants: ${plan.want}`);
  if (plan.stake) lines.push(`If they fail: ${plan.stake}`);
  if (plan.opposition) lines.push(`In the way: ${plan.opposition}`);
  if (plan.complications.length) {
    lines.push('Troubles waiting to happen, in order:');
    plan.complications.forEach((c, i) => lines.push(`  ${i + 1}. ${c}`));
  } else {
    lines.push(`A trouble to build on: ${plan.complication}`);
  }
  if (plan.secret) {
    lines.push(`The story's open question: ${plan.secret}`);
    lines.push(`Its answer (plant clues; reveal it near the climax): ${plan.secretAnswer}`);
  }
  if (plan.theme) lines.push(`What the choices keep testing (never state it): ${plan.theme}`);
  lines.push(`An unusual ingredient to work in: ${plan.ingredient}`);
  if (plan.names.length) {
    lines.push(`When a new character needs a name, take one from: ${plan.names.join(', ')}.`);
  }
  return lines.join('\n');
}

// ── pacing ──────────────────────────────────────────────────────────────────

export type Phase = 'opening' | 'rising' | 'deepening' | 'climax' | 'landing';

/** Used for stories written before plans existed. */
export const DEFAULT_TARGET_SCENES = 12;

/** Where in the story the scene at `position` (0-based) falls. */
export function phaseFor(position: number, targetScenes: number): Phase {
  if (position <= 0) return 'opening';
  const progress = position / Math.max(targetScenes, 4);
  if (progress < 0.5) return 'rising';
  if (progress < 0.75) return 'deepening';
  if (progress < 1) return 'climax';
  return 'landing';
}

const PHASE_NOTES: Record<Phase, string> = {
  opening:
    "OPENING. Put the reader in a specific place, show what their character wants and what is at stake, and end on the first sign of trouble or the story's open question. Do not explain the plan.",
  rising:
    'RISING TROUBLE. Each scene must make the problem harder or stranger. Bring in the next waiting trouble if none is active. The first real setback must have happened by the third scene. Do not solve the central problem yet.',
  deepening:
    'DEEPENING. Things get harder and more personal, and the lowest moment of the story belongs here. Start no new mysteries or characters: use what the story already has. Plant a clue to the open question. Do not solve the central problem yet.',
  climax:
    'CLIMAX. Bring the reader face to face with what stands in the way. The answer to the open question comes out and changes what the reader should do. The central problem may be resolved by the end of this phase, at a cost.',
  landing:
    'LANDING. The story is ready to end. Resolve what is still open, show what has changed, and let things settle. Introduce nothing new. One of the three choices should plainly bring the story home.',
};

/** The pacing note the narrator gets each turn. */
export function describePacing(position: number, targetScenes: number): string {
  const phase = phaseFor(position, targetScenes);
  return `PACING: this is scene ${position + 1} of about ${targetScenes}. ${PHASE_NOTES[phase]}`;
}
