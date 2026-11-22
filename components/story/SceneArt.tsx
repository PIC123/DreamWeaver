'use client';

import { useState } from 'react';
import type { Scene } from '@/lib/story/types';
import styles from './story.module.css';

type Props = {
  scene: Scene | null;
  /** The most recent earlier picture, kept on screen until this scene has its own. */
  previousUrl?: string | null;
  /** True while this scene's own picture is being painted. */
  painting: boolean;
  /** True while the next scene is still being written, so a new picture is coming. */
  anticipating?: boolean;
  /** Present only for the author, and only when another attempt is allowed. */
  onPaint?: () => void;
};

/**
 * A scene's illustration. While a new picture is being painted the previous one
 * stays in place under a soft glow; when the new one arrives it materialises
 * over the old from the centre outwards.
 */
export default function SceneArt({
  scene,
  previousUrl = null,
  painting,
  anticipating = false,
  onPaint,
}: Props) {
  const ownUrl = scene?.imageUrl ?? null;
  const url = ownUrl ?? previousUrl;

  // Remember what was showing before, so the new picture has something to appear over.
  const [layers, setLayers] = useState<{ top: string | null; under: string | null }>({
    top: url,
    under: null,
  });
  if (url && layers.top !== url) setLayers({ top: url, under: layers.top });

  const [loadedUrl, setLoadedUrl] = useState<string | null>(null);
  const incoming = painting || anticipating;
  const waiting = !ownUrl || anticipating;
  const canRetry = !!scene && !!onPaint && scene.canPaint && !incoming;

  if (!url) {
    return (
      <div className={`${styles.art} ${styles.artEmpty} ${incoming ? styles.artGlow : ''}`}>
        {incoming ? (
          <>
            <div className={styles.spinner} aria-hidden="true" />
            <p role="status">Painting your scene…</p>
          </>
        ) : canRetry ? (
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

  return (
    <div
      className={`${styles.art} ${waiting ? styles.artWaiting : ''} ${waiting && incoming ? styles.artGlow : ''}`}
    >
      {/* Illustrations live in Supabase Storage; plain img tags avoid an image-proxy bill. */}
      {layers.under && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={layers.under}
          src={layers.under}
          alt=""
          aria-hidden="true"
          className={styles.artUnder}
        />
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={url}
        src={url}
        // An earlier scene's picture standing in is decoration, not this scene's illustration.
        alt={ownUrl ? `Illustration: ${scene!.narration.slice(0, 140)}` : ''}
        className={`${styles.artTop} ${loadedUrl === url ? styles.artMaterialize : ''}`}
        onLoad={() => setLoadedUrl(url)}
        ref={(img) => {
          // Cached images can finish loading before React attaches onLoad.
          if (img?.complete && img.naturalWidth > 0)
            setLoadedUrl((prev) => (prev === url ? prev : url));
        }}
      />

      {waiting && incoming && (
        <>
          <div className={styles.artAurora} aria-hidden="true" />
          <p className={styles.artStatus} role="status">
            ✨ Painting the next scene…
          </p>
        </>
      )}
      {waiting && !incoming && (
        <div className={styles.artOverlay}>
          <p>{canRetry ? 'This scene has no picture yet.' : 'No picture for this scene.'}</p>
          {canRetry && (
            <button type="button" className={styles.ghostButton} onClick={onPaint}>
              🎨 Paint it
            </button>
          )}
        </div>
      )}
    </div>
  );
}
