'use client';

import { Suspense, useEffect, useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import AccountMenu from '@/components/ui/AccountMenu';
import Starfield from '@/components/ui/Starfield';
import { ApiError, createStory, randomSetting } from '@/lib/api';
import { LIMITS } from '@/lib/story/types';

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
  const { user, isGuest, loading, problem } = useAuth();

  const [setting, setSetting] = useState('');
  const [link, setLink] = useState('');
  const [starting, setStarting] = useState(false);
  const [rolling, setRolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Members land on their bookshelf unless they came here to start a new story.
  useEffect(() => {
    if (!loading && user && !isGuest && !createNew) router.replace('/dashboard');
  }, [loading, user, isGuest, createNew, router]);

  const ready = !loading && !!user;

  const begin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (setting.trim()) {
      if (!ready) return;
      setStarting(true);
      try {
        const id = await createStory(setting);
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
