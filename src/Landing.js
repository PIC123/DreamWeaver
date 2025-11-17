import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Landing.css';

export default function Landing() {
  const [setting, setSetting] = useState('');
  const [storyId, setStoryId] = useState('');
  const navigate = useNavigate();

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

  return (
    <div className="landing-container">
      <div className="stars"></div>
      <div className="nebula nebula-1"></div>
      <div className="nebula nebula-2"></div>

      <div className="content-wrapper">
        <h1 className="magical-title">
          <span className="title-word">Dream</span>
          <span className="title-word">Weaver</span>
        </h1>
        <p className="subtitle">Where stories come to life under starlit skies</p>

        <div className="input-container">
          <div className="input-group">
            <label htmlFor="setting-input">Begin Your Journey</label>
            <input
              id="setting-input"
              type="text"
              value={setting}
              onChange={handleChange}
              onKeyPress={handleKeyPress}
              placeholder="Enter a magical setting..."
              className="magical-input"
            />
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
    </div>
  );
}
