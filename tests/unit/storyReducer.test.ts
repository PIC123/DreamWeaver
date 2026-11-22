import { describe, expect, it } from 'vitest';
import { storyReducer, type StoryState } from '@/hooks/useStory';
import { EMPTY_BIBLE, type StoryBible } from '@/lib/story/bible';
import type { Scene, Story } from '@/lib/story/types';

const story: Story = {
  id: 's1',
  ownerId: 'u1',
  setting: 'A cloud city',
  coverUrl: null,
  sceneCount: 1,
  isPublic: false,
  updatedAt: '2026-01-01T00:00:00Z',
  bible: EMPTY_BIBLE,
};

const scene = (position: number, extra: Partial<Scene> = {}): Scene => ({
  id: `scene-${position}`,
  position,
  action: position === 0 ? null : `action ${position}`,
  narration: `narration ${position}`,
  choices: [],
  imageUrl: null,
  canPaint: true,
  ...extra,
});

const ready = (scenes: Scene[]): StoryState =>
  storyReducer(
    {
      status: 'loading',
      story: null,
      scenes: [],
      pending: null,
      painting: [],
      notice: null,
      newItems: [],
    },
    { type: 'loaded', story, scenes },
  );

describe('storyReducer', () => {
  it('streams a turn and ends with exactly one new scene', () => {
    let state = ready([scene(0)]);
    state = storyReducer(state, { type: 'turn-started', action: 'Jump' });
    state = storyReducer(state, { type: 'turn-delta', text: 'You ' });
    state = storyReducer(state, { type: 'turn-delta', text: 'land.' });
    expect(state.pending).toEqual({ action: 'Jump', text: 'You land.' });
    expect(state.scenes).toHaveLength(1);

    state = storyReducer(state, { type: 'turn-finished', scene: scene(1), bible: EMPTY_BIBLE });
    expect(state.pending).toBeNull();
    expect(state.scenes.map((s) => s.id)).toEqual(['scene-0', 'scene-1']);
  });

  it('never adds the same scene twice', () => {
    let state = ready([scene(0)]);
    state = storyReducer(state, { type: 'turn-finished', scene: scene(1), bible: EMPTY_BIBLE });
    state = storyReducer(state, {
      type: 'turn-finished',
      scene: scene(1, { narration: 'again' }),
      bible: EMPTY_BIBLE,
    });
    expect(state.scenes).toHaveLength(2);
    expect(state.scenes[1].narration).toBe('again');
  });

  it('a failed turn leaves the story as it was, with a message', () => {
    let state = ready([scene(0)]);
    state = storyReducer(state, { type: 'turn-started', action: 'Jump' });
    state = storyReducer(state, { type: 'turn-failed', message: 'Try again.' });
    expect(state.pending).toBeNull();
    expect(state.scenes).toHaveLength(1);
    expect(state.notice).toBe('Try again.');
  });

  it('attaches a finished picture to its own scene and sets the first cover', () => {
    let state = ready([scene(0), scene(1)]);
    state = storyReducer(state, { type: 'paint-started', sceneId: 'scene-1' });
    expect(state.painting).toEqual(['scene-1']);
    state = storyReducer(state, {
      type: 'paint-finished',
      sceneId: 'scene-1',
      imageUrl: 'https://img/1',
    });
    expect(state.painting).toEqual([]);
    expect(state.scenes[0].imageUrl).toBeNull();
    expect(state.scenes[1]).toMatchObject({ imageUrl: 'https://img/1', canPaint: false });
    expect(state.story?.coverUrl).toBe('https://img/1');

    state = storyReducer(state, {
      type: 'paint-finished',
      sceneId: 'scene-0',
      imageUrl: 'https://img/0',
    });
    expect(state.story?.coverUrl).toBe('https://img/1');
  });

  it('a quiet paint failure does not overwrite an existing message', () => {
    let state = ready([scene(0)]);
    state = storyReducer(state, { type: 'notice', message: 'Earlier problem' });
    state = storyReducer(state, { type: 'paint-started', sceneId: 'scene-0' });
    state = storyReducer(state, { type: 'paint-failed', sceneId: 'scene-0', message: '' });
    expect(state.notice).toBe('Earlier problem');
    expect(state.painting).toEqual([]);
  });

  it('takes the updated bible from each turn and notes newly gained items', () => {
    const withLamp: StoryBible = { ...EMPTY_BIBLE, items: [{ name: 'Lamp', description: '' }] };
    const withKey: StoryBible = {
      ...EMPTY_BIBLE,
      summary: 'Found a key.',
      items: [
        { name: 'Lamp', description: '' },
        { name: 'Brass key', description: 'cold' },
      ],
    };
    let state = ready([scene(0)]);
    state = storyReducer(state, { type: 'turn-finished', scene: scene(1), bible: withLamp });
    expect(state.newItems).toEqual(['Lamp']);
    state = storyReducer(state, { type: 'turn-finished', scene: scene(2), bible: withKey });
    expect(state.story?.bible.summary).toBe('Found a key.');
    expect(state.newItems).toEqual(['Brass key']);
    state = storyReducer(state, { type: 'turn-finished', scene: scene(3), bible: withKey });
    expect(state.newItems).toEqual([]);
  });
});
