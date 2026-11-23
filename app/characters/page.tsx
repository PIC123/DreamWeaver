'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import AccountMenu from '@/components/ui/AccountMenu';
import {
  ApiError,
  deleteCharacter,
  draftCharacter,
  fetchMyCharacters,
  saveCharacter,
  type PortraitDraft,
} from '@/lib/api';
import { CHARACTER_LIMITS } from '@/lib/story/options';
import type { Character } from '@/lib/story/types';
import styles from './characters.module.css';

const messageOf = (err: unknown, fallback: string) =>
  err instanceof ApiError ? err.message : fallback;

const PROMPTS = [
  'How old do they look, and how are they built?',
  'Hair, eyes, skin, fur or feathers?',
  'What do they always wear, and in what colours?',
  'What do they carry or keep close?',
  'One thing nobody else has: a scar, a hat, odd socks?',
];

export default function CharactersPage() {
  const { user, isGuest, loading: authLoading, problem, claimVersion } = useAuth();
  const userId = user?.id ?? null;

  const [characters, setCharacters] = useState<Character[] | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [draft, setDraft] = useState<PortraitDraft | null>(null);
  const [appearance, setAppearance] = useState('');
  const [chosen, setChosen] = useState<number | null>(null);
  const [painting, setPainting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    fetchMyCharacters(userId).then(
      (list) => {
        if (!cancelled) setCharacters(list);
      },
      (err) => {
        if (!cancelled) setError(messageOf(err, "Couldn't load your characters."));
      },
    );
    return () => {
      cancelled = true;
    };
  }, [userId, claimVersion]);

  const paint = async (e?: FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    setError(null);
    setPainting(true);
    try {
      const next = await draftCharacter(name, description);
      setDraft(next);
      setAppearance(next.appearance);
      setChosen(null);
    } catch (err) {
      setError(messageOf(err, "Couldn't paint your character. Please try again."));
    } finally {
      setPainting(false);
    }
  };

  const keep = async () => {
    if (!draft || chosen === null) return;
    setError(null);
    setSaving(true);
    try {
      const character = await saveCharacter({
        name,
        appearance,
        draftId: draft.draftId,
        option: chosen,
      });
      setCharacters((prev) => [...(prev ?? []), character]);
      setDraft(null);
      setChosen(null);
      setName('');
      setDescription('');
    } catch (err) {
      setError(messageOf(err, "Couldn't save your character. Please try again."));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (character: Character) => {
    if (!window.confirm(`Delete ${character.name}? Stories they are already in keep them.`)) return;
    setDeleting(character.id);
    setError(null);
    try {
      await deleteCharacter(character.id);
      setCharacters((prev) => prev?.filter((c) => c.id !== character.id) ?? null);
    } catch (err) {
      setError(messageOf(err, "Couldn't delete that character."));
    } finally {
      setDeleting(null);
    }
  };

  const full = (characters?.length ?? 0) >= CHARACTER_LIMITS.maxPerUser;
  const busy = painting || saving;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/?createNew=1" className={styles.back}>
          ← Start a story
        </Link>
        <h1>Your Characters</h1>
        <AccountMenu />
      </header>

      <main className={styles.main}>
        {(error || problem) && (
          <p className={styles.error} role="alert">
            {error ?? problem}
          </p>
        )}
        {isGuest && !authLoading && (characters?.length ?? 0) > 0 && (
          <p className={styles.note}>
            You are exploring as a guest, so your characters live only in this browser. Sign up to
            keep them on every device.
          </p>
        )}

        {characters && characters.length > 0 && (
          <section aria-label="Saved characters">
            <ul className={styles.shelf}>
              {characters.map((character) => (
                <li key={character.id} className={styles.card}>
                  {character.portraitUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={character.portraitUrl} alt={`Portrait of ${character.name}`} />
                  ) : (
                    <div className={styles.noPortrait} aria-hidden="true">
                      🎭
                    </div>
                  )}
                  <div className={styles.cardBody}>
                    <h2>{character.name}</h2>
                    <p>{character.appearance}</p>
                    <button
                      type="button"
                      className={styles.deleteButton}
                      onClick={() => remove(character)}
                      disabled={deleting === character.id}
                    >
                      {deleting === character.id ? 'Deleting…' : 'Delete'}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className={styles.creator} aria-labelledby="creator-title">
          <h2 id="creator-title">Create a character</h2>
          <p className={styles.lead}>
            Describe who you want to be in your stories, in as much detail as you like. The more you
            tell the illustrator, the more the portraits will look like what you imagine.
          </p>

          {full ? (
            <p className={styles.note}>
              You have {CHARACTER_LIMITS.maxPerUser} characters, which is the most you can keep.
              Delete one to make room for another.
            </p>
          ) : (
            <form onSubmit={paint} className={styles.form}>
              <label htmlFor="character-name">Name</label>
              <input
                id="character-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={CHARACTER_LIMITS.nameMaxLength}
                placeholder="What are they called?"
                required
                disabled={busy}
                autoComplete="off"
              />

              <label htmlFor="character-description">What do they look like?</label>
              <textarea
                id="character-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={CHARACTER_LIMITS.descriptionMaxLength}
                rows={6}
                placeholder="A small, quick girl of about ten with a cloud of red curls, a patched green coat three sizes too big…"
                required
                minLength={10}
                disabled={busy}
              />
              <ul className={styles.prompts} aria-label="Ideas to describe">
                {PROMPTS.map((prompt) => (
                  <li key={prompt}>{prompt}</li>
                ))}
              </ul>

              <button type="submit" className={styles.primary} disabled={busy}>
                {painting
                  ? '🎨 Painting portraits… (about half a minute)'
                  : draft
                    ? '🎨 Paint a new set'
                    : '🎨 Paint my character'}
              </button>
            </form>
          )}

          {draft && !full && (
            <div className={styles.options}>
              <h3>Choose the one that feels right</h3>
              <div className={styles.optionGrid} role="radiogroup" aria-label="Portrait options">
                {draft.options.map((url, index) => (
                  <button
                    key={url}
                    type="button"
                    role="radio"
                    aria-checked={chosen === index}
                    aria-label={`Portrait option ${index + 1}`}
                    className={`${styles.option} ${chosen === index ? styles.optionChosen : ''}`}
                    onClick={() => setChosen(index)}
                    disabled={busy}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" />
                  </button>
                ))}
              </div>

              <label htmlFor="character-appearance">
                How the illustrator will describe them (you can edit this)
              </label>
              <textarea
                id="character-appearance"
                value={appearance}
                onChange={(e) => setAppearance(e.target.value)}
                maxLength={320}
                rows={3}
                disabled={busy}
              />

              <button
                type="button"
                className={styles.primary}
                onClick={keep}
                disabled={busy || chosen === null || !appearance.trim()}
              >
                {saving
                  ? 'Saving…'
                  : chosen === null
                    ? 'Pick a portrait to keep'
                    : '✨ Keep this character'}
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
