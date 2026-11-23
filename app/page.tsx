'use client';

import { Suspense, useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import AccountMenu from '@/components/ui/AccountMenu';
import Starfield from '@/components/ui/Starfield';
import { usePreferences } from '@/hooks/usePreferences';
import { ApiError, createStory, fetchMyCharacters, randomSetting } from '@/lib/api';
import { ART_STYLES, READING_LEVELS, type ArtStyle, type ReadingLevel } from '@/lib/story/options';
import { LIMITS, type Character } from '@/lib/story/types';

export default function LandingPage() {
  return (
    <Suspense fallback={null}>
      <Landing />
    </Suspense>
  );
}

/** Accepts a full story link or a bare id and returns the id. */
function storyIdFrom(input: string): string | null {
  const trimmed = input.trim();
  const fromLink = /\/story\/([\w-]+)/.exec(trimmed);
  const id = fromLink ? fromLink[1] : trimmed;
  return /^[\w-]{1,64}$/.test(id) ? id : null;
}

function Landing() {
  const router = useRouter();
  const createNew = useSearchParams().get('createNew') === '1';
  const { user, isGuest, loading, problem, claimVersion } = useAuth();
  const userId = user?.id ?? null;

  const [setting, setSetting] = useState('');
  const [link, setLink] = useState('');
  // Each select starts from the reader's preference until they change it here.
  const { preferences, save: savePreferences } = usePreferences();
  const [pickedLevel, setReadingLevel] = useState<ReadingLevel | null>(null);
  const [pickedStyle, setArtStyle] = useState<ArtStyle | null>(null);
  const [pickedCharacter, setCharacterId] = useState<string | null>(null);
  const readingLevel = pickedLevel ?? preferences.readingLevel;
  const artStyle = pickedStyle ?? preferences.artStyle;
  const [characters, setCharacters] = useState<Character[]>([]);
  const [starting, setStarting] = useState(false);
  const [rolling, setRolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Members land on their bookshelf unless they came here to start a new story.
  useEffect(() => {
    if (!loading && user && !isGuest && !createNew) router.replace('/dashboard');
  }, [loading, user, isGuest, createNew, router]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    fetchMyCharacters(userId).then(
      (list) => {
        if (!cancelled) setCharacters(list);
      },
      () => {
        /* the picker simply stays empty */
      },
    );
    return () => {
      cancelled = true;
    };
  }, [userId, claimVersion]);

  const characterId =
    [pickedCharacter, preferences.characterId].find(
      (id) => id !== null && (id === '' || characters.some((c) => c.id === id)),
    ) ?? '';

  const ready = !loading && !!user;

  const begin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (setting.trim()) {
      if (!ready) return;
      setStarting(true);
      try {
        const id = await createStory({
          setting,
          readingLevel,
          artStyle,
          characterId: characterId || null,
        });
        // Guests have no settings page, so their last choices become their defaults.
        if (isGuest)
          void savePreferences({ readingLevel, artStyle, characterId: characterId || null });
        router.push(`/story/${id}`);
      } catch (err) {
        setError(
          err instanceof ApiError ? err.message : "Couldn't start your story. Please try again.",
        );
        setStarting(false);
      }
      return;
    }

    if (link.trim()) {
      const id = storyIdFrom(link);
      if (id) router.push(`/story/${id}`);
      else setError("That doesn't look like a story link.");
      return;
    }

    setError('Describe a setting to begin, or roll the dice for an idea.');
  };

  const roll = async () => {
    setRolling(true);
    setError(null);
    try {
      setSetting(await randomSetting());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't think of a setting. Try again.");
    } finally {
      setRolling(false);
    }
  };

  return (
    <div className="landing-container">
      <Starfield />
      <div className="nebula nebula-1" aria-hidden="true" />
      <div className="nebula nebula-2" aria-hidden="true" />

      <div className="auth-header">
        <AccountMenu />
      </div>

      <div className="content-wrapper">
        <h1 className="magical-title">
          <span className="title-word">Dream</span>
          <span className="title-word">Weaver</span>
        </h1>
        <p className="subtitle">Where stories come to life under starlit skies</p>

        {problem && (
          <p className="landing-error" role="alert">
            {problem}
          </p>
        )}

        <form className="input-container" onSubmit={begin}>
          <div className="input-group">
            <label htmlFor="setting-input">Begin Your Journey</label>
            <div className="input-with-button">
              <input
                id="setting-input"
                type="text"
                value={setting}
                onChange={(e) => setSetting(e.target.value)}
                maxLength={LIMITS.settingMaxLength}
                placeholder="Describe a magical setting…"
                className="magical-input"
                disabled={rolling || starting}
                autoComplete="off"
              />
              <button
                type="button"
                onClick={roll}
                className="random-setting-button"
                disabled={!ready || rolling || starting}
                title="Surprise me with a setting"
                aria-label="Surprise me with a setting"
              >
                {rolling ? '✨' : '🎲'}
              </button>
            </div>
          </div>

          <div className="story-options">
            <div className="story-option">
              <label htmlFor="character-select">Your character</label>
              <select
                id="character-select"
                className="magical-select"
                value={characterId}
                onChange={(e) => setCharacterId(e.target.value)}
                disabled={starting}
              >
                <option value="">Let the story decide</option>
                {characters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <Link href="/characters" className="story-option-link">
                {characters.length ? 'Manage characters' : '＋ Create a character'}
              </Link>
            </div>

            <div className="story-option">
              <label htmlFor="level-select">Reading level</label>
              <select
                id="level-select"
                className="magical-select"
                value={readingLevel}
                onChange={(e) => setReadingLevel(e.target.value as ReadingLevel)}
                disabled={starting}
              >
                {Object.entries(READING_LEVELS).map(([key, level]) => (
                  <option key={key} value={key}>
                    {level.label}: {level.hint.toLowerCase()}
                  </option>
                ))}
              </select>
            </div>

            <div className="story-option">
              <label htmlFor="style-select">Art style</label>
              <select
                id="style-select"
                className="magical-select"
                value={artStyle}
                onChange={(e) => setArtStyle(e.target.value as ArtStyle)}
                disabled={starting}
              >
                {Object.entries(ART_STYLES).map(([key, style]) => (
                  <option key={key} value={key}>
                    {style.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="divider">
            <span>or</span>
          </div>

          <div className="input-group">
            <label htmlFor="story-link-input">Open a Shared Story</label>
            <input
              id="story-link-input"
              type="text"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="Paste a story link…"
              className="magical-input"
              disabled={starting}
              autoComplete="off"
            />
          </div>

          {error && (
            <p className="landing-error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="magical-button" disabled={starting}>
            <span className="button-content">
              <span className="button-text">
                {starting ? 'Opening the book…' : 'Enter the Realm'}
              </span>
              <span className="button-icon">✨</span>
            </span>
          </button>
        </form>
      </div>

      <div className="floating-book" aria-hidden="true" />
    </div>
  );
}
