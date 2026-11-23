'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { fetchScenes, fetchStory } from '@/lib/api';
import type { Scene, Story } from '@/lib/story/types';
import styles from './print.module.css';

type Loaded = { story: Story; scenes: Scene[] } | 'missing' | null;

/**
 * A plain, paper-friendly layout of a whole story: a cover, then one page per
 * scene. The browser's own Print dialog turns it into paper or a PDF.
 */
export default function PrintStoryPage({ params }: { params: Promise<{ storyId: string }> }) {
  const { storyId } = use(params);
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id ?? null;
  const [loaded, setLoaded] = useState<Loaded>(null);

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    (async () => {
      try {
        const story = await fetchStory(storyId);
        if (!story) return !cancelled && setLoaded('missing');
        const scenes = await fetchScenes(story.id);
        if (!cancelled) setLoaded({ story, scenes });
      } catch {
        if (!cancelled) setLoaded('missing');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [storyId, userId, authLoading]);

  if (loaded === null) return <p className={styles.status}>Preparing your book…</p>;
  if (loaded === 'missing') {
    return (
      <p className={styles.status}>
        We couldn&apos;t find that story. <Link href="/">Back to DreamWeaver</Link>
      </p>
    );
  }

  const { story, scenes } = loaded;

  return (
    <div className={styles.sheet}>
      <div className={styles.toolbar}>
        <Link href={`/story/${story.id}`}>← Back to the story</Link>
        <span>Choose “Save as PDF” in the print dialog to keep a copy.</span>
        <button type="button" onClick={() => window.print()}>
          🖨️ Print or save as PDF
        </button>
      </div>

      <section className={`${styles.page} ${styles.cover}`}>
        {story.coverUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={story.coverUrl} alt="" />
        )}
        <h1>{story.setting}</h1>
        <p>A DreamWeaver storybook</p>
      </section>

      {scenes.map((scene, i) => (
        <section key={scene.id} className={styles.page}>
          {scene.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={scene.imageUrl} alt={`Illustration for page ${i + 1}`} />
          )}
          {scene.action && <p className={styles.action}>{scene.action}</p>}
          <p className={styles.narration}>{scene.narration}</p>
          {story.finished && i === scenes.length - 1 && <p className={styles.theEnd}>The End</p>}
          <span className={styles.pageNumber}>{i + 1}</span>
        </section>
      ))}
    </div>
  );
}
