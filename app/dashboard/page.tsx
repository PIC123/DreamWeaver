'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { deleteStory, getUserStories } from '@/lib/storyService';
import type { StoryRow } from '@/types/story';
import { getAnonToken, listAnonStoryIds, forgetAnonToken } from '@/lib/anonStore';
import { loadStory } from '@/lib/storyService';
import './Dashboard.css';

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, signOut, loading: authLoading } = useAuth();
  const [stories, setStories] = useState<StoryRow[]>([]);
  const [anonStories, setAnonStories] = useState<StoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await getUserStories(user.id);
      if (error) {
        setErrorMessage(error.message);
      } else {
        setStories(data);
      }
      // Also surface anonymous stories the user owns from this device
      const anonIds = listAnonStoryIds();
      const loaded: StoryRow[] = [];
      await Promise.all(
        anonIds.map(async (storyId) => {
          const { data: row } = await loadStory(storyId);
          if (row && row.is_anonymous) loaded.push(row);
        }),
      );
      setAnonStories(loaded);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/');
      return;
    }
    loadAll();
  }, [authLoading, user, router, loadAll]);

  const handleContinue = (storyId: string) => router.push(`/story/${encodeURIComponent(storyId)}`);

  const handleDelete = async (storyId: string, isAnonymous: boolean) => {
    if (!window.confirm('Are you sure you want to delete this story?')) return;
    const anonToken = isAnonymous ? getAnonToken(storyId) : null;
    const { error } = await deleteStory(storyId, anonToken);
    if (error) {
      window.alert(`Failed to delete story: ${error.message}`);
      return;
    }
    if (isAnonymous) forgetAnonToken(storyId);
    setStories((prev) => prev.filter((s) => s.story_id !== storyId));
    setAnonStories((prev) => prev.filter((s) => s.story_id !== storyId));
  };

  const handleNewStory = () => router.push('/?createNew=1');

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const allStories = [...stories, ...anonStories];

  return (
    <div className="dashboard-container">
      <div className="dashboard-overlay" />

      <div className="dashboard-header">
        <h1 className="dashboard-title">Your Story Collection</h1>
        <div className="dashboard-header-actions">
          <button onClick={handleNewStory} className="new-story-button" type="button">
            + New Story
          </button>
          <div className="user-menu-container">
            <button
              type="button"
              className="user-menu-button"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              {user?.email ?? 'Account'}
            </button>
            {showUserMenu && (
              <div className="user-menu-dropdown">
                <button onClick={handleSignOut} className="user-menu-item" type="button">
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        {loading ? (
          <div className="loading-state">
            <div className="spinner" />
            <p>Loading your stories...</p>
          </div>
        ) : errorMessage ? (
          <div className="loading-state">
            <p>{errorMessage}</p>
          </div>
        ) : allStories.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📖</div>
            <h2>No Stories Yet</h2>
            <p>Your adventure awaits! Create your first story to begin.</p>
            <button onClick={handleNewStory} className="empty-state-button" type="button">
              Start Your Journey
            </button>
          </div>
        ) : (
          <div className="stories-grid">
            {allStories.map((story) => (
              <div key={story.id} className="story-card">
                <div className="story-card-image-wrapper">
                  {story.img_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={story.img_url}
                      alt={story.setting ?? 'Untitled story'}
                      className="story-card-image"
                      onClick={() => handleContinue(story.story_id)}
                    />
                  ) : (
                    <div className="story-card-placeholder">
                      <span>📖</span>
                    </div>
                  )}
                  <div className="story-card-overlay">
                    <button
                      type="button"
                      onClick={() => handleContinue(story.story_id)}
                      className="continue-button"
                    >
                      Continue Story
                    </button>
                  </div>
                </div>
                <div className="story-card-content">
                  <h3 className="story-card-title">{story.setting || 'Untitled Story'}</h3>
                  <p className="story-card-id">ID: {story.story_id}</p>
                  <div className="story-card-meta">
                    <span className="story-card-date">{formatDate(story.updated_at)}</span>
                    <span className="story-card-images">
                      {story.story_images?.length || 0} scenes
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(story.story_id, story.is_anonymous)}
                    className="delete-button"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
