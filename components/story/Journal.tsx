'use client';

import { useEffect } from 'react';
import { HERO_NAME, sameName, type StoryBible } from '@/lib/story/bible';
import styles from './story.module.css';

type Props = { bible: StoryBible; onClose: () => void };

/** The reader's journal: the story so far, who and where they have met, and what they carry. */
export default function Journal({ bible, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className={styles.journalBackdrop} onClick={onClose}>
      <aside
        className={styles.journal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="journal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className={styles.journalHeader}>
          <h2 id="journal-title">📔 Journal</h2>
          <button type="button" className={styles.ghostButton} onClick={onClose}>
            ✕ Close
          </button>
        </header>

        <section>
          <h3>The story so far</h3>
          <p>{bible.summary || 'Your story is just beginning.'}</p>
        </section>

        {bible.threads.length > 0 && (
          <section>
            <h3>Loose threads</h3>
            <ul className={styles.journalList}>
              {bible.threads.map((thread) => (
                <li key={thread}>{thread}</li>
              ))}
            </ul>
          </section>
        )}

        <section>
          <h3>Carrying</h3>
          {bible.items.length === 0 ? (
            <p className={styles.journalEmpty}>Nothing yet.</p>
          ) : (
            <dl className={styles.journalEntries}>
              {bible.items.map((item) => (
                <div key={item.name}>
                  <dt>🎒 {item.name}</dt>
                  {item.description && <dd>{item.description}</dd>}
                </div>
              ))}
            </dl>
          )}
        </section>

        {bible.characters.length > 0 && (
          <section>
            <h3>Characters</h3>
            <dl className={styles.journalEntries}>
              {bible.characters.map((c) => (
                <div key={c.name}>
                  <dt>
                    {sameName(c.name, HERO_NAME) ? 'You' : c.name}
                    {c.role && <span> · {c.role}</span>}
                  </dt>
                  {c.appearance && <dd>{c.appearance}</dd>}
                </div>
              ))}
            </dl>
          </section>
        )}

        {bible.places.length > 0 && (
          <section>
            <h3>Places</h3>
            <dl className={styles.journalEntries}>
              {bible.places.map((p) => (
                <div key={p.name}>
                  <dt>{p.name}</dt>
                  {p.appearance && <dd>{p.appearance}</dd>}
                </div>
              ))}
            </dl>
          </section>
        )}
      </aside>
    </div>
  );
}
