'use client';

import { Suspense, useEffect, useState, type KeyboardEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import AuthModal from '@/components/auth/AuthModal';
import { generateStoryId } from '@/lib/storyId';
import { postRandomSetting } from '@/lib/api';
import './Landing.css';

export default function LandingPage() {
  return (
    <Suspense fallback={null}>
      <Landing />
    </Suspense>
  );
}

function Landing() {
  const [setting, setSetting] = useState('');
  const [storyId, setStoryId] = useState('');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isGeneratingSetting, setIsGeneratingSetting] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, signOut, loading } = useAuth();

  const createNew = searchParams.get('createNew') === '1';

  // Redirect logged-in users to dashboard (unless they're creating a new story)
  useEffect(() => {
    if (!loading && user && !createNew) {
      router.replace('/dashboard');
    }
  }, [user, loading, createNew, router]);

  const startNewStory = () => {
    if (!setting.trim()) return;
    const id = generateStoryId();
    router.push(`/story/${id}?setting=${encodeURIComponent(setting)}`);
  };

  const continueStory = () => {
    if (!storyId.trim()) return;
    router.push(`/story/${encodeURIComponent(storyId)}`);
  };

  const handleSubmit = () => {
    if (setting) startNewStory();
    else if (storyId) continueStory();
  };

  const handleKeyPress = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') handleSubmit();
  };

  const openAuthModal = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleSignOut = async () => {
    await signOut();
    setShowUserMenu(false);
  };

  const generateRandomSetting = async () => {
    setIsGeneratingSetting(true);
    try {
      const generated = await postRandomSetting();
      setSetting(generated);
    } catch (err) {
      console.error('Error generating setting:', err);
    } finally {
      setIsGeneratingSetting(false);
    }
  };

  return (
    <div className="landing-container">
      <div className="stars" aria-hidden="true">
        {Array.from({ length: 100 }).map((_, i) => (
          <span
            key={i}
            className="star"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>
      <div className="nebula nebula-1" aria-hidden="true" />
      <div className="nebula nebula-2" aria-hidden="true" />

      <div className="auth-header">
        {user ? (
          <div className="user-menu-container">
            <button
              className="user-menu-button"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              {user.email}
            </button>
            {showUserMenu && (
              <div className="user-menu-dropdown">
                <button onClick={() => router.push('/dashboard')} className="user-menu-item">
                  My Stories
                </button>
                <button onClick={handleSignOut} className="user-menu-item">
                  Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="auth-buttons">
            <button onClick={() => openAuthModal('login')} className="auth-header-button">
              Sign In
            </button>
            <button
              onClick={() => openAuthModal('signup')}
              className="auth-header-button signup"
            >
              Sign Up
            </button>
          </div>
        )}
      </div>

      <div className="content-wrapper">
        <h1 className="magical-title">
          <span className="title-word">Dream</span>
          <span className="title-word">Weaver</span>
        </h1>
        <p className="subtitle">Where stories come to life under starlit skies</p>

        <div className="input-container">
          <div className="input-group">
            <label htmlFor="setting-input">Begin Your Journey</label>
            <div className="input-with-button">
              <input
                id="setting-input"
                type="text"
                value={setting}
                onChange={(e) => setSetting(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Enter a magical setting..."
                className="magical-input"
                disabled={isGeneratingSetting}
              />
              <button
                onClick={generateRandomSetting}
                className="random-setting-button"
                disabled={isGeneratingSetting}
                title="Generate random setting"
                aria-label="Generate random setting"
                type="button"
              >
                {isGeneratingSetting ? '✨' : '🎲'}
              </button>
            </div>
          </div>

          <div className="divider">
            <span>or</span>
          </div>

          <div className="input-group">
            <label htmlFor="story-id-input">Continue Your Adventure</label>
            <input
              id="story-id-input"
              type="text"
              value={storyId}
              onChange={(e) => setStoryId(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Enter Story ID..."
              className="magical-input"
            />
          </div>

          <button onClick={handleSubmit} className="magical-button" type="button">
            <span className="button-content">
              <span className="button-text">Enter the Realm</span>
              <span className="button-icon">✨</span>
            </span>
          </button>
        </div>
      </div>

      <div className="floating-book" aria-hidden="true" />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        mode={authMode}
      />
    </div>
  );
}
