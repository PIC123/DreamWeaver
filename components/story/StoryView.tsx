'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import AuthModal from '@/components/auth/AuthModal';
import type { useStory } from '@/hooks/useStory';
import ActionInput from './ActionInput';
import BookView from './BookView';
import SceneArt from './SceneArt';
import ShareControl from './ShareControl';
import styles from './story.module.css';

type Props = { story: ReturnType<typeof useStory> };

/** The author's view: play the story on the right, watch it illustrated on the left. */
export default function StoryView({ story: s }: Props) {
  const { isGuest } = useAuth();
  const [bookOpen, setBookOpen] = useState(false);
  const [signUpOpen, setSignUpOpen] = useState(false);
  const [pickedSceneId, setPickedSceneId] = useState<string | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  const story = s.story!;
  const latest = s.scenes[s.scenes.length - 1] ?? null;
  // While a new turn is being written, follow it rather than an older pick.
  const shown = (!s.busy && s.scenes.find((sc) => sc.id === pickedSceneId)) || latest;
  const choices = s.busy ? [] : (latest?.choices ?? []);
  // The newest earlier picture, kept on screen until the shown scene has its own.
  const previousUrl =
    (shown &&
      [...s.scenes].reverse().find((sc) => sc.position < shown.position && sc.imageUrl)
        ?.imageUrl) ||
    null;

  // Keep the newest words in view as they arrive (but leave a freshly opened
  // story at the top). On desktop the log scrolls inside its own box; on
  // phones the page itself scrolls.
  const pendingText = s.pending?.text;
  const settled = useRef(false);
  useEffect(() => {
    if (!settled.current) {
      settled.current = true;
      if (!s.busy) return;
    }
    const log = logRef.current;
    if (!log) return;
    if (getComputedStyle(log).overflowY === 'visible') {
      window.scrollTo({ top: document.documentElement.scrollHeight });
    } else {
      log.scrollTop = log.scrollHeight;
    }
  }, [s.scenes.length, pendingText, s.busy]);

  useEffect(() => {
    if (!bookOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setBookOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [bookOpen]);

  const act = (action: string) => {
    setPickedSceneId(null);
    void s.takeTurn(action);
  };

  const composer = (placeholder?: string) => (
    <>
      {choices.length > 0 && (
        <div className={styles.choices} aria-label="Suggested actions">
          {choices.map((choice) => (
            <button
              key={choice}
              type="button"
              className={styles.choice}
              onClick={() => act(choice)}
            >
              {choice}
            </button>
          ))}
        </div>
      )}
      <ActionInput disabled={s.busy || !latest} onSubmit={act} placeholder={placeholder} />
    </>
  );

  return (
    <div className={styles.shell}>
      <div
        className={styles.backdrop}
        style={shown?.imageUrl ? { backgroundImage: `url("${shown.imageUrl}")` } : undefined}
        aria-hidden="true"
      />

      <header className={styles.header}>
        <Link href="/dashboard" className={styles.ghostButton} aria-label="Back to my stories">
          ← Stories
        </Link>
        <h1 className={styles.title} title={story.setting}>
          {story.setting}
        </h1>
        <div className={styles.headerActions}>
          {isGuest && (
            <button
              type="button"
              className={styles.ghostButton}
              onClick={() => setSignUpOpen(true)}
            >
              💾 Keep my stories
            </button>
          )}
          <ShareControl isPublic={story.isPublic} onChange={s.setSharing} />
          <button
            type="button"
            className={styles.bookButton}
            onClick={() => setBookOpen(true)}
            disabled={s.scenes.length === 0}
          >
            📖 Book View
          </button>
        </div>
      </header>

      <main className={styles.body}>
        <section className={styles.artColumn} aria-label="Illustrations">
          <SceneArt
            scene={shown}
            previousUrl={previousUrl}
            painting={!!shown && s.painting.includes(shown.id)}
            anticipating={s.busy && s.scenes.length > 0}
            onPaint={shown ? () => void s.paint(shown) : undefined}
          />
          {s.scenes.length > 1 && (
            <div className={styles.filmstrip} aria-label="Scenes">
              {s.scenes.map((scene, i) => (
                <button
                  key={scene.id}
                  type="button"
                  className={`${styles.thumb} ${scene.id === shown?.id ? styles.thumbActive : ''}`}
                  onClick={() => setPickedSceneId(scene.id)}
                  aria-label={`Show scene ${i + 1}`}
                  aria-current={scene.id === shown?.id}
                >
                  {scene.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={scene.imageUrl} alt="" loading="lazy" />
                  ) : (
                    <span>{i + 1}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </section>

        <section className={styles.textColumn} aria-label="Story">
          {s.notice && (
            <div className={styles.notice} role="alert">
              <span>{s.notice}</span>
              <button type="button" onClick={s.dismissNotice} aria-label="Dismiss">
                ✕
              </button>
            </div>
          )}

          <div className={styles.log} ref={logRef} role="log" aria-live="polite">
            {s.scenes.map((scene) => (
              <div key={scene.id} className={styles.beat}>
                {scene.action && <p className={styles.said}>{scene.action}</p>}
                <p className={styles.told}>{scene.narration}</p>
              </div>
            ))}
            {s.pending && (
              <div className={styles.beat}>
                {s.pending.action && <p className={styles.said}>{s.pending.action}</p>}
                <p className={`${styles.told} ${styles.writing}`}>
                  {s.pending.text || '✨ Weaving your tale…'}
                </p>
              </div>
            )}
          </div>

          <div className={styles.composer}>{composer()}</div>
        </section>
      </main>

      {bookOpen && (
        <div className={styles.desk} role="dialog" aria-modal="true" aria-label="Book view">
          <button type="button" className={styles.closeBook} onClick={() => setBookOpen(false)}>
            ✕ Close book
          </button>
          <BookView
            title={story.setting}
            scenes={s.scenes}
            pending={s.pending}
            paintingIds={s.painting}
            startAt="latest"
          >
            <div className={styles.bookComposer}>
              <h2>What happens next?</h2>
              {composer('Or write your own next step…')}
            </div>
          </BookView>
        </div>
      )}

      {signUpOpen && <AuthModal mode="signup" onClose={() => setSignUpOpen(false)} />}
    </div>
  );
}
