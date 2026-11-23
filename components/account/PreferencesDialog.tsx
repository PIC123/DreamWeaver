'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePreferences } from '@/hooks/usePreferences';
import { ART_STYLES, READING_LEVELS, type ArtStyle, type ReadingLevel } from '@/lib/story/options';
import '@/components/auth/AuthModal.css';
import styles from './preferences.module.css';

type Props = {
  /** "welcome" is the first-time flow for a new member; "settings" is the same form later. */
  mode: 'welcome' | 'settings';
  onClose: () => void;
};

/**
 * Lets a reader set how they like their stories. For a new member it is also
 * the welcome: after saving, it invites them to create their character.
 */
export default function PreferencesDialog({ mode, onClose }: Props) {
  const { preferences, save } = usePreferences();
  const [readingLevel, setReadingLevel] = useState<ReadingLevel>(preferences.readingLevel);
  const [artStyle, setArtStyle] = useState<ArtStyle>(preferences.artStyle);
  const [step, setStep] = useState<'preferences' | 'character'>('preferences');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Skipping still counts as having been welcomed, so it is not shown again.
  const dismiss = () => {
    if (mode === 'welcome' && step === 'preferences') void save({ onboarded: true });
    onClose();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, step]);

  const submit = async () => {
    setSaving(true);
    setError(null);
    const problem = await save({ readingLevel, artStyle, onboarded: true });
    setSaving(false);
    if (problem) return setError(problem);
    if (mode === 'welcome') setStep('character');
    else onClose();
  };

  return createPortal(
    <div className="auth-modal-overlay" onClick={dismiss}>
      <div
        className={`auth-modal-content ${styles.dialog}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="preferences-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="auth-modal-close" onClick={dismiss} aria-label="Close">
          ✕
        </button>

        {step === 'preferences' ? (
          <>
            <h2 id="preferences-title" className="auth-modal-title">
              {mode === 'welcome' ? 'Welcome to DreamWeaver' : 'Your Preferences'}
            </h2>
            <p className="auth-modal-subtitle">
              {mode === 'welcome'
                ? 'Tell us how you like your stories. You can change these for any story, and here at any time.'
                : 'These are the starting choices for each new story.'}
            </p>

            <fieldset className={styles.group}>
              <legend>Who are the stories for?</legend>
              <div className={styles.levels}>
                {(Object.keys(READING_LEVELS) as ReadingLevel[]).map((key) => (
                  <label
                    key={key}
                    className={`${styles.level} ${readingLevel === key ? styles.levelChosen : ''}`}
                  >
                    <input
                      type="radio"
                      name="reading-level"
                      value={key}
                      checked={readingLevel === key}
                      onChange={() => setReadingLevel(key)}
                      disabled={saving}
                    />
                    <span className={styles.levelName}>{READING_LEVELS[key].label}</span>
                    <span className={styles.levelHint}>{READING_LEVELS[key].hint}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className={styles.group}>
              <label htmlFor="preferred-style">Favourite art style</label>
              <select
                id="preferred-style"
                className={styles.select}
                value={artStyle}
                onChange={(e) => setArtStyle(e.target.value as ArtStyle)}
                disabled={saving}
              >
                {(Object.keys(ART_STYLES) as ArtStyle[]).map((key) => (
                  <option key={key} value={key}>
                    {ART_STYLES[key].label}
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <div className="auth-error" role="alert">
                {error}
              </div>
            )}

            <button type="button" className="auth-submit-button" onClick={submit} disabled={saving}>
              {saving ? '✨ Saving…' : mode === 'welcome' ? 'Save and continue' : 'Save'}
            </button>
            {mode === 'welcome' && (
              <button type="button" className="auth-link-button" onClick={dismiss}>
                Skip for now
              </button>
            )}
          </>
        ) : (
          <>
            <h2 id="preferences-title" className="auth-modal-title">
              Who will you be?
            </h2>
            <p className="auth-modal-subtitle">
              Create a character to play as. Describe them however you like, choose a portrait, and
              they will look the same in every story.
            </p>
            <div className={styles.portraitHint} aria-hidden="true">
              🎭
            </div>
            <Link
              href="/characters"
              className={`auth-submit-button ${styles.linkButton}`}
              onClick={onClose}
            >
              Create my character
            </Link>
            <button type="button" className="auth-link-button" onClick={onClose}>
              Maybe later
            </button>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
