import React, { useState, useEffect } from 'react';
import './BookView.css';

export default function BookView({
  messages,
  storyImages,
  possibleActions,
  onActionClick,
  onClose
}) {
  const [currentSpread, setCurrentSpread] = useState(0);
  const [customAction, setCustomAction] = useState('');
  const [previousSceneCount, setPreviousSceneCount] = useState(0);
  const [isImageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImg, setSelectedImg] = useState('');
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState('forward');

  // Convert messages to scenes
  const scenes = messages
    .map((message, index) => {
      if (message.sender === 'system') {
        let userAction = null;
        for (let i = index - 1; i >= 0; i--) {
          if (messages[i].sender === 'user') {
            userAction = messages[i].text;
            break;
          }
        }

        const systemMessageIndex = messages.slice(0, index + 1).filter(m => m.sender === 'system').length - 1;

        return {
          text: message.text,
          image: storyImages[systemMessageIndex] || null,
          action: userAction
        };
      }
      return null;
    })
    .filter(scene => scene !== null);

  const totalScenes = scenes.length;
  const totalSpreads = Math.ceil((totalScenes + 1) / 2); // +1 for actions page

  // Calculate which scenes are visible on current spread
  const leftSceneIndex = currentSpread * 2 - 1; // -1 because first page is cover
  const rightSceneIndex = currentSpread * 2;

  const leftScene = leftSceneIndex >= 0 ? scenes[leftSceneIndex] : null;
  const rightScene = scenes[rightSceneIndex] || null;

  const canGoBack = currentSpread > 0;
  const canGoForward = currentSpread < totalSpreads - 1;

  const handleNextSpread = () => {
    if (!canGoForward || isFlipping) return;
    setFlipDirection('forward');
    setIsFlipping(true);
    setTimeout(() => {
      setCurrentSpread(prev => prev + 1);
      setIsFlipping(false);
    }, 600);
  };

  const handlePrevSpread = () => {
    if (!canGoBack || isFlipping) return;
    setFlipDirection('backward');
    setIsFlipping(true);
    setTimeout(() => {
      setCurrentSpread(prev => prev - 1);
      setIsFlipping(false);
    }, 600);
  };

  const handleCustomAction = (e) => {
    e.preventDefault();
    if (customAction.trim()) {
      onActionClick(customAction);
      setCustomAction('');
    }
  };

  const toggleImageModal = (imageUrl) => {
    setSelectedImg(imageUrl);
    setImageModalOpen(!isImageModalOpen);
  };

  // Jump to last spread when new content arrives
  useEffect(() => {
    if (scenes.length > previousSceneCount) {
      setPreviousSceneCount(scenes.length);
      const lastSpread = Math.ceil((scenes.length + 1) / 2) - 1;
      setCurrentSpread(lastSpread);
    }
  }, [scenes.length, previousSceneCount]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') handlePrevSpread();
      if (e.key === 'ArrowRight') handleNextSpread();
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSpread, isFlipping]);

  // Render a single page
  const renderPage = (scene, isLeft, pageNum) => {
    if (!scene && currentSpread === 0 && isLeft) {
      // Cover page
      return (
        <div className="book-cover">
          <div className="book-cover-title">Dream Weaver</div>
          <div className="book-cover-subtitle">An Interactive Storybook</div>
          <div className="book-cover-ornament">✨</div>
        </div>
      );
    }

    if (!scene && currentSpread === totalSpreads - 1 && !isLeft) {
      // Actions page
      return (
        <div className="book-last-page">
          <h3 className="last-page-title">What happens next?</h3>

          {possibleActions && possibleActions.length > 0 && (
            <div className="book-actions-grid">
              {possibleActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => onActionClick(action)}
                  className="book-action-button"
                >
                  {action}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleCustomAction} className="custom-action-form">
            <input
              type="text"
              value={customAction}
              onChange={(e) => setCustomAction(e.target.value)}
              placeholder="Or type your own action..."
              className="custom-action-input"
            />
            <button type="submit" className="custom-action-submit">
              Continue Story
            </button>
          </form>
        </div>
      );
    }

    if (!scene) {
      return <div className="page-empty"></div>;
    }

    // Regular story page
    return (
      <>
        <div className="page-image-wrapper-large">
          {scene.image ? (
            <img
              src={scene.image}
              alt="Story scene"
              className="page-image-large"
              onClick={() => toggleImageModal(scene.image)}
              style={{ cursor: 'pointer' }}
            />
          ) : (
            <div className="page-image-placeholder">
              <div className="page-image-placeholder-icon">✨</div>
              <div className="page-image-placeholder-text">Drawing your dream...</div>
            </div>
          )}
        </div>

        <div className="page-text-content">
          {scene.text ? (
            <>
              {scene.action && (
                <div className="page-story-action">{scene.action}</div>
              )}
              <div className="page-story-text">{scene.text}</div>
            </>
          ) : (
            <div className="page-text-placeholder">
              The story unfolds as ink meets parchment...
            </div>
          )}
        </div>

        <div className="page-number">{pageNum}</div>
      </>
    );
  };

  return (
    <div className="book-view-container">
      <button className="book-close-button" onClick={onClose}>
        ✕ Exit Book View
      </button>

      <div className={`book ${isFlipping ? `flipping-${flipDirection}` : ''}`}>
        {/* Left Page */}
        <div className="page page-left">
          {renderPage(leftScene, true, leftSceneIndex >= 0 ? leftSceneIndex + 1 : null)}
        </div>

        {/* Book Spine */}
        <div className="book-spine"></div>

        {/* Right Page */}
        <div className="page page-right">
          {renderPage(rightScene, false, rightSceneIndex < totalScenes ? rightSceneIndex + 1 : null)}
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="book-nav-controls">
        <button
          className="nav-button nav-prev"
          onClick={handlePrevSpread}
          disabled={!canGoBack || isFlipping}
        >
          ← Previous
        </button>

        <div className="page-indicator">
          Spread {currentSpread + 1} of {totalSpreads}
        </div>

        <button
          className="nav-button nav-next"
          onClick={handleNextSpread}
          disabled={!canGoForward || isFlipping}
        >
          Next →
        </button>
      </div>

      {/* Corner navigation hints */}
      {canGoBack && (
        <div className="corner-nav corner-nav-left" onClick={handlePrevSpread}>
          <span>←</span>
        </div>
      )}
      {canGoForward && (
        <div className="corner-nav corner-nav-right" onClick={handleNextSpread}>
          <span>→</span>
        </div>
      )}

      {/* Image Modal */}
      {isImageModalOpen && (
        <div className="book-image-modal" onClick={() => toggleImageModal('')}>
          <img src={selectedImg} alt="Enlarged Scene" className="book-enlarged-image" />
        </div>
      )}
    </div>
  );
}
