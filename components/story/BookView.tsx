'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import type { Scene } from '@/lib/story/types';
import type { PendingTurn } from '@/hooks/useStory';
import styles from './book.module.css';

type Props = {
  title: string;
  scenes: Scene[];
  /** A scene still being written, shown as the book's newest page. */
  pending?: PendingTurn | null;
  paintingIds?: string[];
  /** Readers start at the cover; an author picks up at the newest page. */
  startAt: 'cover' | 'latest';
  /** Rendered under the book, e.g. the author's choices for what happens next. */
  children?: ReactNode;
};

type Spread = { key: string; left: ReactNode; right: ReactNode; speech: string };

function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (notify) => {
      const mq = window.matchMedia(query);
      mq.addEventListener('change', notify);
      return () => mq.removeEventListener('change', notify);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

function Illustration({
  url,
  alt,
  painting,
}: {
  url: string | null;
  alt: string;
  painting: boolean;
}) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img className={styles.illustration} src={url} alt={alt} />;
  }
  return (
    <div className={styles.illustrationEmpty}>
      <span aria-hidden="true">✨</span>
      <p>{painting ? 'The illustrator is painting…' : 'Left to the imagination'}</p>
    </div>
  );
}

/**
 * A picture book: each scene is a spread with its illustration on the left
 * page and its words on the right. Pages turn with a 3D flip on wide screens
 * and a gentle fade on phones or when reduced motion is requested.
 */
export default function BookView({
  title,
  scenes,
  pending = null,
  paintingIds = [],
  startAt,
  children,
}: Props) {
  const narrow = useMediaQuery('(max-width: 760px)');
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  const spreads = useMemo<Spread[]>(() => {
    const cover: Spread = {
      key: 'cover',
      left: null,
      right: (
        <div className={styles.cover}>
          <div className={styles.coverOrnament} aria-hidden="true">
            ✨
          </div>
          <h2 className={styles.coverTitle}>{title}</h2>
          <p className={styles.coverSubtitle}>A DreamWeaver storybook</p>
        </div>
      ),
      speech: title,
    };

    const pages = scenes.map<Spread>((scene, i) => ({
      key: scene.id,
      left: (
        <Illustration
          url={scene.imageUrl}
          alt={`Illustration for page ${i + 1}`}
          painting={paintingIds.includes(scene.id)}
        />
      ),
      right: (
        <div className={styles.text}>
          {scene.action && <p className={styles.action}>{scene.action}</p>}
          <p className={styles.narration}>{scene.narration}</p>
          <span className={styles.pageNumber}>{i + 1}</span>
        </div>
      ),
      speech: scene.narration,
    }));

    if (pending) {
      pages.push({
        key: 'pending',
        left: <Illustration url={null} alt="" painting />,
        right: (
          <div className={styles.text}>
            {pending.action && <p className={styles.action}>{pending.action}</p>}
            <p className={styles.narration} aria-live="polite">
              {pending.text || 'The next page is being written…'}
              <span className={styles.caret} aria-hidden="true" />
            </p>
          </div>
        ),
        speech: '',
      });
    }
    return [cover, ...pages];
  }, [title, scenes, pending, paintingIds]);

  const last = spreads.length - 1;
  const [index, setIndex] = useState(startAt === 'latest' ? last : 0);
  const [flipTo, setFlipTo] = useState<number | null>(null);

  // When a new page is added, turn to it.
  const [knownLength, setKnownLength] = useState(spreads.length);
  if (knownLength !== spreads.length) {
    setKnownLength(spreads.length);
    setIndex(last);
    setFlipTo(null);
  }

  const current = Math.min(index, last);
  const animate = !narrow && !reducedMotion;

  const goTo = useCallback(
    (target: number) => {
      if (target < 0 || target > last || target === current || flipTo !== null) return;
      if (animate) setFlipTo(target);
      else setIndex(target);
    },
    [animate, current, flipTo, last],
  );

  const finishFlip = () => {
    if (flipTo === null) return;
    setIndex(flipTo);
    setFlipTo(null);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) return;
      if (e.key === 'ArrowLeft') goTo(current - 1);
      if (e.key === 'ArrowRight') goTo(current + 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [current, goTo]);

  // Swipe to turn pages on touch screens.
  const swipeStart = useRef<number | null>(null);
  const onPointerDown = (e: React.PointerEvent) => {
    swipeStart.current = e.pointerType === 'mouse' ? null : e.clientX;
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (swipeStart.current === null) return;
    const dx = e.clientX - swipeStart.current;
    swipeStart.current = null;
    if (dx < -50) goTo(current + 1);
    if (dx > 50) goTo(current - 1);
  };

  // Read aloud, using the browser's built-in voices.
  const [speaking, setSpeaking] = useState(false);
  const canSpeak = useSyncExternalStore(
    () => () => {},
    () => 'speechSynthesis' in window,
    () => false,
  );
  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window)
      window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);
  useEffect(() => stopSpeaking, [current, stopSpeaking]);

  const toggleSpeech = () => {
    if (speaking) return stopSpeaking();
    const words = spreads[current].speech;
    if (!words) return;
    const utterance = new SpeechSynthesisUtterance(words);
    utterance.rate = 0.95;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  };

  const from = spreads[current];
  const to = flipTo !== null ? spreads[flipTo] : null;
  const forward = flipTo !== null && flipTo > current;

  // While a leaf is mid-turn, the pages underneath are a mix of both spreads.
  const underLeft = to && !forward ? to.left : from.left;
  const underRight = to && forward ? to.right : from.right;

  const label =
    current === 0
      ? 'Cover'
      : `Page ${current} of ${last}${from.key === 'pending' ? ' (being written)' : ''}`;

  return (
    <div className={styles.wrap}>
      <div
        className={`${styles.book} ${narrow ? styles.single : ''}`}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        data-testid="book"
        data-spread={current}
      >
        {narrow ? (
          <div key={from.key} className={`${styles.page} ${styles.singlePage}`}>
            {from.left && <div className={styles.singleArt}>{from.left}</div>}
            {from.right}
          </div>
        ) : (
          <>
            <div
              className={`${styles.page} ${styles.left} ${underLeft ? '' : styles.blank}`}
              onClick={() => goTo(current - 1)}
            >
              {underLeft}
            </div>
            <div className={`${styles.page} ${styles.right}`} onClick={() => goTo(current + 1)}>
              {underRight}
            </div>

            {to && (
              <div
                className={`${styles.leaf} ${forward ? styles.leafForward : styles.leafBackward}`}
                onAnimationEnd={finishFlip}
              >
                <div
                  className={`${styles.page} ${styles.face} ${forward ? styles.right : styles.left} ${
                    (forward ? from.right : from.left) ? '' : styles.blank
                  }`}
                >
                  {forward ? from.right : from.left}
                </div>
                <div
                  className={`${styles.page} ${styles.face} ${styles.faceBack} ${forward ? styles.left : styles.right} ${
                    (forward ? to.left : to.right) ? '' : styles.blank
                  }`}
                >
                  {forward ? to.left : to.right}
                </div>
              </div>
            )}
            <div className={styles.spine} aria-hidden="true" />
          </>
        )}
      </div>

      <nav className={styles.nav} aria-label="Book pages">
        <button type="button" onClick={() => goTo(current - 1)} disabled={current === 0}>
          ← Previous
        </button>
        <span className={styles.indicator} aria-live="polite">
          {label}
        </span>
        {canSpeak && (
          <button
            type="button"
            onClick={toggleSpeech}
            disabled={!from.speech}
            aria-pressed={speaking}
            title={speaking ? 'Stop reading' : 'Read this page aloud'}
          >
            {speaking ? '⏹ Stop' : '🔊 Read aloud'}
          </button>
        )}
        <button type="button" onClick={() => goTo(current + 1)} disabled={current === last}>
          Next →
        </button>
      </nav>

      {children}
    </div>
  );
}
