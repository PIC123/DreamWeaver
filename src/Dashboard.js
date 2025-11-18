import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import * as storyService from './services/storyService';
import './Dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    // Redirect if not logged in
    if (!user) {
      navigate('/');
      return;
    }

    loadUserStories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, navigate]);

  const loadUserStories = async () => {
    setLoading(true);
    try {
      const { data, error } = await storyService.getUserStories(user.id);

      if (error) {
        console.error('Error loading stories:', error);
        return;
      }

      setStories(data || []);
    } catch (error) {
      console.error('Error loading stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContinueStory = (storyId, setting) => {
    navigate('/story', { state: { storyId, setting } });
  };

  const handleDeleteStory = async (storyId) => {
    if (!window.confirm('Are you sure you want to delete this story?')) {
      return;
    }

    try {
      const { error } = await storyService.deleteStory(storyId);

      if (error) {
        console.error('Error deleting story:', error);
        alert('Failed to delete story. Please try again.');
        return;
      }

      // Remove from local state
      setStories(stories.filter(s => s.story_id !== storyId));
    } catch (error) {
      console.error('Error deleting story:', error);
      alert('Failed to delete story. Please try again.');
    }
  };

  const handleNewStory = () => {
    navigate('/', { state: { createNew: true } });
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-overlay"></div>

      {/* Header */}
      <div className="dashboard-header">
        <h1 className="dashboard-title">Your Story Collection</h1>
        <div className="dashboard-header-actions">
          <button onClick={handleNewStory} className="new-story-button">
            + New Story
          </button>
          <div className="user-menu-container">
            <button
              className="user-menu-button"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              {user?.email}
            </button>
            {showUserMenu && (
              <div className="user-menu-dropdown">
                <button onClick={handleSignOut} className="user-menu-item">
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stories Grid */}
      <div className="dashboard-content">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading your stories...</p>
          </div>
        ) : stories.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📖</div>
            <h2>No Stories Yet</h2>
            <p>Your adventure awaits! Create your first story to begin.</p>
            <button onClick={handleNewStory} className="empty-state-button">
              Start Your Journey
            </button>
          </div>
        ) : (
          <div className="stories-grid">
            {stories.map((story) => (
              <div key={story.id} className="story-card">
                <div className="story-card-image-wrapper">
                  {story.img_url ? (
                    <img
                      src={story.img_url}
                      alt={story.setting}
                      className="story-card-image"
                      onClick={() => handleContinueStory(story.story_id, story.setting)}
                    />
                  ) : (
                    <div className="story-card-placeholder">
                      <span>📖</span>
                    </div>
                  )}
                  <div className="story-card-overlay">
                    <button
                      onClick={() => handleContinueStory(story.story_id, story.setting)}
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
                    <span className="story-card-date">
                      {formatDate(story.updated_at)}
                    </span>
                    <span className="story-card-images">
                      {story.story_images?.length || 0} scenes
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteStory(story.story_id)}
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
