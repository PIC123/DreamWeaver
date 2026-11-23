'use client';

import { useCallback, useEffect, useReducer, useRef } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import * as api from '@/lib/api';
import { sameName, type StoryBible } from '@/lib/story/bible';
import type { Scene, Story } from '@/lib/story/types';

/** The turn currently being written: what the reader did and the text so far. */
export type PendingTurn = { action: string | null; text: string };

export type StoryState = {
  status: 'loading' | 'ready' | 'missing' | 'failed';
  story: Story | null;
  scenes: Scene[];
  pending: PendingTurn | null;
  /** Ids of scenes whose illustration is being painted right now. */
  painting: string[];
  /** A message for the reader about the last thing that went wrong, if any. */
  notice: string | null;
  /** Names of items picked up in the most recent turn, for a moment of fanfare. */
  newItems: string[];
};

type Action =
  | { type: 'loaded'; story: Story; scenes: Scene[] }
  | { type: 'missing' }
  | { type: 'failed'; message: string }
  | { type: 'turn-started'; action: string | null }
  | { type: 'turn-delta'; text: string }
  | { type: 'turn-finished'; scene: Scene; bible: StoryBible; finished?: boolean }
  | { type: 'turn-failed'; message: string }
  | { type: 'paint-started'; sceneId: string }
  | { type: 'paint-finished'; sceneId: string; imageUrl: string }
  | { type: 'paint-failed'; sceneId: string; message: string }
  | { type: 'scenes-refreshed'; scenes: Scene[] }
  | { type: 'sharing-changed'; isPublic: boolean }
  | { type: 'notice'; message: string | null };

const initialState: StoryState = {
  status: 'loading',
  story: null,
  scenes: [],
  pending: null,
  painting: [],
  notice: null,
  newItems: [],
};

export function storyReducer(state: StoryState, action: Action): StoryState {
  switch (action.type) {
    case 'loaded':
      return { ...initialState, status: 'ready', story: action.story, scenes: action.scenes };
    case 'missing':
      return { ...initialState, status: 'missing' };
    case 'failed':
      return { ...initialState, status: 'failed', notice: action.message };
    case 'turn-started':
      return { ...state, pending: { action: action.action, text: '' }, notice: null };
    case 'turn-delta':
      return state.pending
        ? { ...state, pending: { ...state.pending, text: state.pending.text + action.text } }
        : state;
    case 'turn-finished':
      return {
        ...state,
        pending: null,
        story: state.story
          ? {
              ...state.story,
              bible: action.bible,
              finished: state.story.finished || action.finished === true,
            }
          : state.story,
        newItems: action.bible.items
          .map((item) => item.name)
          .filter((name) => !state.story?.bible.items.some((had) => sameName(had.name, name))),
        // Replace by id so a retried or duplicated event can never add a scene twice.
        scenes: [...state.scenes.filter((s) => s.id !== action.scene.id), action.scene].sort(
          (a, b) => a.position - b.position,
        ),
      };
    case 'turn-failed':
      return { ...state, pending: null, notice: action.message };
    case 'paint-started':
      return { ...state, painting: [...state.painting, action.sceneId] };
    case 'paint-finished':
      return {
        ...state,
        painting: state.painting.filter((id) => id !== action.sceneId),
        scenes: state.scenes.map((s) =>
          s.id === action.sceneId ? { ...s, imageUrl: action.imageUrl, canPaint: false } : s,
        ),
        story:
          state.story && !state.story.coverUrl
            ? { ...state.story, coverUrl: action.imageUrl }
            : state.story,
      };
    case 'paint-failed':
      return {
        ...state,
        painting: state.painting.filter((id) => id !== action.sceneId),
        notice: action.message || state.notice,
      };
    case 'scenes-refreshed':
      return { ...state, scenes: action.scenes };
    case 'sharing-changed':
      return state.story
        ? { ...state, story: { ...state.story, isPublic: action.isPublic } }
        : state;
    case 'notice':
      return { ...state, notice: action.message };
  }
}

const messageOf = (err: unknown, fallback: string) =>
  err instanceof api.ApiError ? err.message : fallback;

/**
 * Everything the story screens need: the story, its scenes, the turn being
 * written, and the actions an author can take. The server owns all writes.
 */
export function useStory(storyId: string) {
  const { user, loading: authLoading, claimVersion } = useAuth();
  const [state, dispatch] = useReducer(storyReducer, initialState);
  const userId = user?.id ?? null;

  // Guards against doing the same network work twice (double clicks, StrictMode).
  const turnInFlight = useRef(false);
  const paintRequested = useRef(new Set<string>());
  const openingRequested = useRef(false);
  const autoPainted = useRef(new Set<string>());

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    (async () => {
      try {
        const story = await api.fetchStory(storyId);
        if (cancelled) return;
        if (!story) return dispatch({ type: 'missing' });
        const scenes = await api.fetchScenes(story.id);
        if (!cancelled) dispatch({ type: 'loaded', story, scenes });
      } catch (err) {
        if (!cancelled)
          dispatch({ type: 'failed', message: messageOf(err, "Couldn't load this story.") });
      }
    })();
    return () => {
      cancelled = true;
    };
    // Reload when the signed-in person changes, or when stories they wrote as a
    // guest have just been moved into their account: what they may see changes.
  }, [storyId, userId, authLoading, claimVersion]);

  const isOwner = !!state.story && !!userId && state.story.ownerId === userId;

  // The latest scenes, readable from callbacks without re-creating them.
  const scenesRef = useRef(state.scenes);
  useEffect(() => {
    scenesRef.current = state.scenes;
  }, [state.scenes]);

  const paint = useCallback(
    async (scene: Scene, { quiet = false } = {}) => {
      if (paintRequested.current.has(scene.id)) return;
      paintRequested.current.add(scene.id);
      dispatch({ type: 'paint-started', sceneId: scene.id });
      try {
        // A busy illustrator is worth waiting for; the scene keeps showing as being painted.
        const imageUrl = await api.retryWhenBusy(() => api.paintScene(storyId, scene.id));
        dispatch({ type: 'paint-finished', sceneId: scene.id, imageUrl });
      } catch (err) {
        paintRequested.current.delete(scene.id);
        dispatch({
          type: 'paint-failed',
          sceneId: scene.id,
          message: quiet ? '' : messageOf(err, "The illustrator couldn't paint this scene."),
        });
        // Pick up the server's view of whether another attempt is allowed.
        api.fetchScenes(storyId).then(
          (scenes) => dispatch({ type: 'scenes-refreshed', scenes }),
          () => {},
        );
      }
    },
    [storyId],
  );

  const takeTurn = useCallback(
    async (action: string | null, { ending = false } = {}) => {
      if (turnInFlight.current) return;
      turnInFlight.current = true;
      dispatch({ type: 'turn-started', action });
      try {
        const { scene, bible, finished } = await api.takeTurn(
          storyId,
          { action, expectedPosition: scenesRef.current.length, ending },
          (text) => dispatch({ type: 'turn-delta', text }),
        );
        dispatch({ type: 'turn-finished', scene, bible, finished });
        if (scene.canPaint) {
          autoPainted.current.add(scene.id);
          void paint(scene);
        }
      } catch (err) {
        dispatch({
          type: 'turn-failed',
          message: messageOf(err, 'The storyteller lost the thread. Please try that again.'),
        });
        if (err instanceof api.ApiError && err.status === 409) {
          api.fetchScenes(storyId).then(
            (scenes) => dispatch({ type: 'scenes-refreshed', scenes }),
            () => {},
          );
        }
      } finally {
        turnInFlight.current = false;
      }
    },
    [storyId, paint],
  );

  // A brand-new story has no scenes yet: ask for the opening.
  useEffect(() => {
    if (state.status !== 'ready' || !isOwner) return;
    if (state.scenes.length === 0 && !openingRequested.current) {
      openingRequested.current = true;
      void takeTurn(null);
    }
  }, [state.status, state.scenes.length, isOwner, takeTurn]);

  // If the newest scene never got its picture (closed tab, failure), try again once.
  useEffect(() => {
    if (state.status !== 'ready' || !isOwner) return;
    const last = state.scenes[state.scenes.length - 1];
    if (last?.canPaint && !autoPainted.current.has(last.id)) {
      autoPainted.current.add(last.id);
      void paint(last, { quiet: true });
    }
  }, [state.status, state.scenes, isOwner, paint]);

  const setSharing = useCallback(
    async (isPublic: boolean) => {
      try {
        await api.setSharing(storyId, isPublic);
        dispatch({ type: 'sharing-changed', isPublic });
        return true;
      } catch (err) {
        dispatch({ type: 'notice', message: messageOf(err, "Couldn't change sharing.") });
        return false;
      }
    },
    [storyId],
  );

  const dismissNotice = useCallback(() => dispatch({ type: 'notice', message: null }), []);

  return {
    ...state,
    isOwner,
    busy: state.pending !== null,
    takeTurn,
    paint,
    setSharing,
    dismissNotice,
  };
}
