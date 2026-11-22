'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import AccountMenu from '@/components/ui/AccountMenu';
import { ApiError, deleteStory, fetchMyStories } from '@/lib/api';
import type { Story } from '@/lib/story/types';
import './Dashboard.css';

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

export default function DashboardPage() {
  const { user, isGuest, loading: authLoading, problem, claimVersion } = useAuth();
  const [stories, setStories] = useState<Story[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const userId = user?.id ?? null;

  useEffect(() => {
    if (authLoading || !userId) return;
    let cancelled = false;
    fetchMyStories(userId).then(
      (list) => {
        if (!cancelled) setStories(list);
      },
      (err) => {
        if (!cancelled)
          setError(err instanceof ApiError ? err.message : "Couldn't load your stories.");
      },
    );
    return () => {
      cancelled = true;
    };
    // claimVersion changes when guest stories are merged into this account.
  }, [authLoading, userId, claimVersion]);

  const remove = async (story: Story) => {
    if (!window.confirm(`Delete "${story.setting}"? This cannot be undone.`)) return;
    setDeleting(story.id);
    setError(null);
    try {
      await deleteStory(story.id);
      setStories((prev) => prev?.filter((s) => s.id !== story.id) ?? null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't delete that story.");
    } finally {
      setDeleting(null);
    }
  };

  const waiting = authLoading || (userId !== null && stories === null && !error);

  return (
    <div className="dashboard-container">
      <div className="dashboard-overlay" />

      <div className="dashboard-header">
        <h1 className="dashboard-title">Your Story Collection</h1>
        <div className="dashboard-header-actions">
          <Link href="/?createNew=1" className="new-story-button">
            + New Story
          </Link>
          <AccountMenu showShelfLink={false} />
        </div>
      </div>

      <div className="dashboard-content">
        {isGuest && !authLoading && (stories?.length ?? 0) > 0 && (
          <p className="dashboard-note">
            You are exploring as a guest, so these stories live only in this browser. Sign up to
            keep them on every device.
          </p>
        )}
        {(error || problem) && (
          <p className="dashboard-note dashboard-note-error" role="alert">
            {error ?? problem}
          </p>
        )}

        {waiting ? (
          <div className="loading-state">
            <div className="spinner" />
            <p>Loading your stories…</p>
          </div>
        ) : !stories || stories.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📖</div>
            <h2>No Stories Yet</h2>
            <p>Your adventure awaits! Create your first story to begin.</p>
            <Link href="/?createNew=1" className="empty-state-button">
              Start Your Journey
            </Link>
          </div>
        ) : (
          <div className="stories-grid">
            {stories.map((story) => (
              <article key={story.id} className="story-card">
                <Link href={`/story/${story.id}`} className="story-card-image-wrapper">
                  {story.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={story.coverUrl} alt="" className="story-card-image" loading="lazy" />
                  ) : (
                    <div className="story-card-placeholder">
                      <span>📖</span>
                    </div>
                  )}
                  <div className="story-card-overlay">
                    <span className="continue-button">Continue Story</span>
                  </div>
                </Link>
                <div className="story-card-content">
                  <h2 className="story-card-title">{story.setting}</h2>
                  <div className="story-card-meta">
                    <span className="story-card-date">{formatDate(story.updatedAt)}</span>
                    <span className="story-card-images">
                      {story.sceneCount} {story.sceneCount === 1 ? 'scene' : 'scenes'}
                      {story.isPublic ? ' · shared' : ''}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(story)}
                    className="delete-button"
                    disabled={deleting === story.id}
                  >
                    {deleting === story.id ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
