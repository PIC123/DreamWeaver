'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import AuthModal from '@/components/auth/AuthModal';
import { useStory } from '@/hooks/useStory';
import SharedStoryView from './SharedStoryView';
import StoryView from './StoryView';
import styles from './story.module.css';

export default function StoryClient({ storyId }: { storyId: string }) {
  const story = useStory(storyId);
  const { isGuest, problem } = useAuth();
  const [signInOpen, setSignInOpen] = useState(false);

  if (story.status === 'loading') {
    return (
      <div className={styles.center}>
        <div className={styles.spinner} aria-hidden="true" />
        <p role="status">Opening your story…</p>
      </div>
    );
  }

  if (story.status === 'missing' || story.status === 'failed') {
    return (
      <div className={styles.center}>
        <h1>
          {story.status === 'missing' ? "We couldn't find that story" : 'Something went wrong'}
        </h1>
        <p>
          {story.status === 'missing'
            ? 'It may be private, or the link may be wrong. If it is yours, sign in to open it.'
            : (story.notice ?? problem ?? 'Please try again in a moment.')}
        </p>
        <div className={styles.centerActions}>
          {isGuest && (
            <button
              type="button"
              className={styles.primaryButton}
              onClick={() => setSignInOpen(true)}
            >
              Sign in
            </button>
          )}
          <Link href="/" className={styles.ghostButton}>
            ← Back to the start
          </Link>
        </div>
        {signInOpen && <AuthModal mode="login" onClose={() => setSignInOpen(false)} />}
      </div>
    );
  }

  return story.isOwner ? (
    <StoryView story={story} />
  ) : (
    <SharedStoryView story={story.story!} scenes={story.scenes} />
  );
}
