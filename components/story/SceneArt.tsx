'use client';

import type { Scene } from '@/lib/story/types';
import styles from './story.module.css';

type Props = {
  scene: Scene | null;
  painting: boolean;
  /** Present only for the author, and only when another attempt is allowed. */
  onPaint?: () => void;
  className?: string;
};

/** A scene's illustration, or an honest placeholder for whatever state it is in. */
export default function SceneArt({ scene, painting, onPaint, className }: Props) {
  const frame = `${styles.art} ${className ?? ''}`;

  if (scene?.imageUrl) {
    return (
      <div className={frame}>
        {/* Illustrations live in Supabase Storage; a plain img avoids an image-proxy bill. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={scene.imageUrl} alt={`Illustration: ${scene.narration.slice(0, 140)}`} />
      </div>
    );
  }

  return (
    <div className={`${frame} ${styles.artEmpty}`}>
      {painting ? (
        <>
          <div className={styles.spinner} aria-hidden="true" />
          <p role="status">Painting your scene…</p>
        </>
      ) : scene && onPaint && scene.canPaint ? (
        <>
          <p>This scene has no picture yet.</p>
          <button type="button" className={styles.ghostButton} onClick={onPaint}>
            🎨 Paint it
          </button>
        </>
      ) : (
        <p>{scene ? 'No picture for this scene.' : 'Your first scene is on its way…'}</p>
      )}
    </div>
  );
}
