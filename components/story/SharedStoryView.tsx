'use client';

import Link from 'next/link';
import type { Scene, Story } from '@/lib/story/types';
import BookView from './BookView';
import styles from './story.module.css';

/** What a visitor sees when someone shares a story with them: the book, read-only. */
export default function SharedStoryView({ story, scenes }: { story: Story; scenes: Scene[] }) {
  return (
    <div className={`${styles.desk} ${styles.deskPage}`}>
      <header className={styles.sharedHeader}>
        <Link href="/" className={styles.brand}>
          ✨ DreamWeaver
        </Link>
        <span className={styles.sharedTag}>A shared story · read only</span>
      </header>

      <BookView title={story.setting} scenes={scenes} startAt="cover" finished={story.finished}>
        <div className={styles.bookComposer}>
          <h2>Want an adventure of your own?</h2>
          <Link href="/?createNew=1" className={styles.primaryLink}>
            Write your own story ✨
          </Link>
          <Link href={`/story/${story.id}/print`} target="_blank" className={styles.ghostButton}>
            🖨️ Print or save as PDF
          </Link>
        </div>
      </BookView>
    </div>
  );
}
