import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import AuthModal from './components/AuthModal';
import { OpenAI as OAI } from "openai";
import './Landing.css';

export default function Landing() {
  const [setting, setSetting] = useState('');
  const [storyId, setStoryId] = useState('');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isGeneratingSetting, setIsGeneratingSetting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut, loading } = useAuth();

  const oai = new OAI({
    apiKey: process.env.REACT_APP_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true,
  });

  // Redirect logged-in users to dashboard (unless they're creating a new story)
  useEffect(() => {
    const createNew = location.state?.createNew;
    if (!loading && user && !createNew) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate, location.state]);

  // Create stars on mount
  useEffect(() => {
    const starContainer = document.querySelector('.stars');
    if (starContainer) {
      for (let i = 0; i < 100; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 100}%`;
        star.style.animationDelay = `${Math.random() * 3}s`;
        star.style.animationDuration = `${2 + Math.random() * 2}s`;
        starContainer.appendChild(star);
      }
    }
  }, []);

  const handleChange = (e) => {
    setSetting(e.target.value);
  };

  const handleIdChange = (e) => {
    setStoryId(e.target.value);
  };

  const handleSubmit = () => {
    if (setting || storyId) {
      navigate('/story', { state: { setting, storyId } });
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
        handleSubmit();
    }
  };

  const openAuthModal = (mode) => {
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
      const response = await oai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a creative story setting generator. Generate unique, exciting, and imaginative story settings."
          },
          {
            role: "user",
            content: "Generate a single creative and exciting setting for a text-based adventure game. Make it unique, interesting, and immersive. It can be fantasy, sci-fi, historical, or any genre. Keep it to one short sentence (5-15 words). Just return the setting, nothing else."
          }
        ],
        max_tokens: 50,
        temperature: 1.2
      });

      const generatedSetting = response.choices[0].message.content.trim();
      setSetting(generatedSetting);
    } catch (error) {
      console.error('Error generating setting:', error);
      // Fallback settings if API fails
      const fallbackSettings = [
        "A mystical floating island above the clouds",
        "An underwater city of bioluminescent creatures",
        "A steampunk Victorian London with time portals",
        "An enchanted forest where seasons change every hour",
        "A space station at the edge of a black hole",
        "A medieval castle that exists in multiple dimensions",
        "A post-apocalyptic desert with ancient ruins",
        "A magical library where books come alive at night"
      ];
      const randomIndex = Math.floor(Math.random() * fallbackSettings.length);
      setSetting(fallbackSettings[randomIndex]);
    } finally {
      setIsGeneratingSetting(false);
    }
  };

  return (
    <div className="landing-container">
      <div className="stars"></div>
      <div className="nebula nebula-1"></div>
      <div className="nebula nebula-2"></div>

      {/* User Menu / Auth Buttons */}
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
                <button onClick={() => navigate('/dashboard')} className="user-menu-item">
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
            <button onClick={() => openAuthModal('signup')} className="auth-header-button signup">
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
                onChange={handleChange}
                onKeyPress={handleKeyPress}
                placeholder="Enter a magical setting..."
                className="magical-input"
                disabled={isGeneratingSetting}
              />
              <button
                onClick={generateRandomSetting}
                className="random-setting-button"
                disabled={isGeneratingSetting}
                title="Generate random setting"
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
              onChange={handleIdChange}
              onKeyPress={handleKeyPress}
              placeholder="Enter Story ID..."
              className="magical-input"
            />
          </div>

          <button onClick={handleSubmit} className="magical-button">
            <span className="button-content">
              <span className="button-text">Enter the Realm</span>
              <span className="button-icon">✨</span>
            </span>
          </button>
        </div>
      </div>

      <div className="floating-book"></div>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        mode={authMode}
      />
    </div>
  );
}
