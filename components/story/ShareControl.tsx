'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './story.module.css';

type Props = {
  isPublic: boolean;
  onChange: (isPublic: boolean) => Promise<boolean>;
};

/** Lets the author publish a read-only link to their story, or take it back. */
export default function ShareControl({ isPublic, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (
        e instanceof KeyboardEvent
          ? e.key === 'Escape'
          : !wrapper.current?.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    window.addEventListener('mousedown', close);
    window.addEventListener('keydown', close);
    return () => {
      window.removeEventListener('mousedown', close);
      window.removeEventListener('keydown', close);
    };
  }, [open]);

  const link = typeof window === 'undefined' ? '' : window.location.href.split(/[?#]/)[0];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked: the link is visible to copy by hand */
    }
  };

  const toggle = async (next: boolean) => {
    setSaving(true);
    const ok = await onChange(next);
    setSaving(false);
    if (ok && next) void copy();
  };

  return (
    <div className={styles.share} ref={wrapper}>
      <button
        type="button"
        className={styles.ghostButton}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        {isPublic ? '🔗 Shared' : '🔗 Share'}
      </button>

      {open && (
        <div className={styles.sharePanel} role="dialog" aria-label="Share this story">
          <label className={styles.shareToggle}>
            <input
              type="checkbox"
              checked={isPublic}
              disabled={saving}
              onChange={(e) => toggle(e.target.checked)}
            />
            <span>Anyone with the link can read this story</span>
          </label>
          <p className={styles.shareHint}>
            {isPublic
              ? 'Readers see the finished book. Only you can continue the story.'
              : 'Right now only you can open this story.'}
          </p>
          {isPublic && (
            <div className={styles.shareLink}>
              <input
                readOnly
                value={link}
                aria-label="Story link"
                onFocus={(e) => e.target.select()}
              />
              <button type="button" className={styles.primaryButton} onClick={copy}>
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
