import { describe, expect, it } from 'vitest';
import { storyReducer, type StoryState } from '@/hooks/useStory';
import type { Scene, Story } from '@/lib/story/types';

const story: Story = {
  id: 's1',
  ownerId: 'u1',
  setting: 'A cloud city',
  coverUrl: null,
  sceneCount: 1,
  isPublic: false,
  updatedAt: '2026-01-01T00:00:00Z',
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
    { status: 'loading', story: null, scenes: [], pending: null, painting: [], notice: null },
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

    state = storyReducer(state, { type: 'turn-finished', scene: scene(1) });
    expect(state.pending).toBeNull();
    expect(state.scenes.map((s) => s.id)).toEqual(['scene-0', 'scene-1']);
  });

  it('never adds the same scene twice', () => {
    let state = ready([scene(0)]);
    state = storyReducer(state, { type: 'turn-finished', scene: scene(1) });
    state = storyReducer(state, { type: 'turn-finished', scene: scene(1, { narration: 'again' }) });
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
});
