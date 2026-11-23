import { describe, expect, it } from 'vitest';
import { EMPTY_BIBLE } from '@/lib/story/bible';
import {
  ARC_SHAPES,
  buildPlanMessages,
  describePacing,
  describePlan,
  normalizePlan,
  phaseFor,
  rollSeeds,
  seedsOnlyPlan,
  type StoryPlan,
} from '@/lib/story/plan';
import { buildMessages } from '@/lib/story/prompt';

/** A small repeatable random source, so the dice can be tested. */
function seeded(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

const plan: StoryPlan = {
  arc: 'fall-rise',
  tone: 'wry and bittersweet',
  complication: 'time is running out',
  ingredient: 'a jar of weather',
  names: ['Amara', 'Bao'],
  targetScenes: 12,
  want: 'to relight the lamp',
  stake: 'the boats are lost',
  opposition: 'the fog',
  complications: ['the oil is gone', 'the stairs give way'],
  secret: 'who put the lamp out?',
  secretAnswer: 'the gull did',
  theme: 'safety or kindness?',
};

describe('rollSeeds', () => {
  it('is repeatable for the same dice and differs between stories', () => {
    expect(rollSeeds('family', seeded(7))).toEqual(rollSeeds('family', seeded(7)));
    const rolls = Array.from({ length: 30 }, (_, i) =>
      rollSeeds('family', seeded((i + 1) * 104729)),
    );
    expect(new Set(rolls.map((r) => r.ingredient)).size).toBeGreaterThan(5);
    expect(new Set(rolls.map((r) => r.arc)).size).toBeGreaterThan(1);
  });

  it('keeps length and tone within the reading level', () => {
    for (let i = 1; i <= 50; i++) {
      const early = rollSeeds('early', seeded(i));
      const advanced = rollSeeds('advanced', seeded(i));
      expect(early.targetScenes).toBeGreaterThanOrEqual(6);
      expect(early.targetScenes).toBeLessThanOrEqual(8);
      expect(advanced.targetScenes).toBeGreaterThanOrEqual(11);
      expect(advanced.targetScenes).toBeLessThanOrEqual(15);
      expect(early.tone).not.toMatch(/eerie|bittersweet|moral/);
      expect(early.names).toHaveLength(5);
      expect(new Set(early.names).size).toBe(5);
      expect(early.arc in ARC_SHAPES).toBe(true);
    }
  });
});

describe('phaseFor', () => {
  it('walks a twelve-scene story through its phases in order', () => {
    const phases = Array.from({ length: 14 }, (_, position) => phaseFor(position, 12));
    expect(phases).toEqual([
      'opening',
      'rising',
      'rising',
      'rising',
      'rising',
      'rising',
      'deepening',
      'deepening',
      'deepening',
      'climax',
      'climax',
      'climax',
      'landing',
      'landing',
    ]);
  });

  it('holds back resolution until the climax and stops new threads after the midpoint', () => {
    expect(describePacing(2, 12)).toContain('Do not solve the central problem yet');
    expect(describePacing(7, 12)).toContain('Start no new mysteries');
    expect(describePacing(10, 12)).toContain('may be resolved');
    expect(describePacing(12, 12)).toContain(
      'One of the three choices should plainly bring the story home',
    );
    expect(describePacing(4, 12)).toMatch(/^PACING: this is scene 5 of about 12\./);
  });
});

describe('the plan in prompts', () => {
  it('asks the planner to build on the code-chosen ingredients', () => {
    const [system, user] = buildPlanMessages({
      setting: 'A cloud harbour',
      level: 'advanced',
      seeds: rollSeeds('advanced', seeded(3)),
      heroLook: 'Pip: a girl in a green coat',
    });
    expect(system.content).toContain('teenagers and adults');
    expect(system.content).toContain('real dilemma');
    expect(user.content).toContain('Setting: A cloud harbour');
    expect(user.content).toContain("The reader's character: Pip: a girl in a green coat");
    expect(user.content).toMatch(/An unusual ingredient to work in: .+/);
    expect(user.content).toMatch(/Length: about 1[1-5] short scenes/);
  });

  it('gives the narrator the plan, including the secret answer, as private notes', () => {
    const text = describePlan(plan);
    expect(text).toContain('never reveal or quote these to the reader');
    expect(text).toContain('Its answer (plant clues; reveal it near the climax): the gull did');
    expect(text).toContain('take one from: Amara, Bao');
    expect(text).toContain('1. the oil is gone');
  });

  it('still guides a story whose planning call failed', () => {
    const text = describePlan(seedsOnlyPlan(rollSeeds('family', seeded(5))));
    expect(text).toContain('A trouble to build on:');
    expect(text).not.toContain("The story's open question");
  });

  it('puts plan, bible and pacing in the system message each turn', () => {
    const messages = buildMessages({
      setting: 'A cloud harbour',
      scenes: [{ action: null, narration: 'Fog rolls in.' }],
      action: 'Light a match',
      bible: EMPTY_BIBLE,
      level: 'family',
      plan,
      targetScenes: plan.targetScenes,
    });
    const system = messages[0].content;
    expect(system.indexOf('STORY PLAN')).toBeGreaterThan(0);
    expect(system.indexOf('STORY BIBLE (established')).toBeGreaterThan(
      system.indexOf('STORY PLAN'),
    );
    expect(system).toContain('PACING: this is scene 2 of about 12. RISING TROUBLE.');
    expect(system).toContain('"yes, but"');
    expect(messages.at(-1)!.content).toBe('Light a match');
  });
});

describe('normalizePlan', () => {
  it('restores a stored plan and tolerates a damaged one', () => {
    expect(normalizePlan(plan, 'advanced')).toEqual(plan);
    const repaired = normalizePlan({ arc: 'nonsense', targetScenes: 9999, want: 5 }, 'early');
    expect(repaired.arc in ARC_SHAPES).toBe(true);
    expect(repaired.targetScenes).toBeLessThanOrEqual(8);
    expect(repaired.want).toBe('');
    expect(repaired.complications).toEqual([]);
  });
});
