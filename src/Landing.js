import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import background from './background.png'; 
import './Landing.css'; 

export default function Landing() {
  const [setting, setSetting] = useState('');
  const [storyId, setStoryId] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setSetting(e.target.value);
  };

  const handleIdChange = (e) => {
    setStoryId(e.target.value);
  };    

  const handleSubmit = () => {
    navigate('/story', { state: { setting, storyId } });
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
        handleSubmit();
    }
  };

  return (
    <div className="landing-wrapper">
      {/* Background with subtle overlay */}
      <div
        className="landing-background"
        style={{
          backgroundImage: `url(${background})`,
        }}
      />

      {/* Book cover */}
      <div className="book-cover">
        {/* Decorative border */}
        <div className="cover-border">
          {/* Title section */}
          <div className="cover-title-section">
            <h1 className="cover-title">DreamWeaver</h1>
            <div className="cover-subtitle">Interactive Tales of Adventure</div>
            <div className="cover-ornament">✦ ✦ ✦</div>
          </div>

          {/* Input section */}
          <div className="cover-content">
            <div className="story-prompt">
              <label className="prompt-label">Begin Your Journey</label>
              <input
                type="text"
                value={setting}
                onChange={handleChange}
                onKeyPress={handleKeyPress}
                placeholder="e.g., a mystical forest, ancient castle, distant galaxy..."
                className="setting-input"
              />
            </div>

            <div className="story-continue">
              <label className="prompt-label">Or Continue Your Tale</label>
              <input
                type="text"
                value={storyId}
                onChange={handleIdChange}
                placeholder="Enter your Story Edition ID"
                className="story-id-input"
              />
            </div>

            <button onClick={handleSubmit} className="start-button">
              <span className="button-text">Open Book</span>
              <span className="button-icon">📖</span>
            </button>
          </div>

          {/* Footer ornament */}
          <div className="cover-footer">
            <div className="footer-ornament">❧</div>
          </div>
        </div>
      </div>
    </div>
  );
}
