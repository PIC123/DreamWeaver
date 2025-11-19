import React, { useState, useEffect, useRef } from 'react';
import './BookView.css';

export default function BookView({
  messages,
  storyImages,
  possibleActions,
  onActionClick,
  onClose
}) {
  const [currentSpread, setCurrentSpread] = useState(0); // Which spread (two-page view) we're on
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState('forward'); // 'forward' or 'backward'
  const [showPageJump, setShowPageJump] = useState(false);
  const [jumpToPage, setJumpToPage] = useState('');
  const [customAction, setCustomAction] = useState('');
  const [previousSceneCount, setPreviousSceneCount] = useState(0);
  const [isImageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImg, setSelectedImg] = useState('');
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);

  // Convert messages to scenes (only system messages, each with user action + image + text)
  const scenes = messages
    .map((message, index) => {
      if (message.sender === 'system') {
        // Find the previous user action (if any)
        let userAction = null;
        for (let i = index - 1; i >= 0; i--) {
          if (messages[i].sender === 'user') {
            userAction = messages[i].text;
            break;
          }
        }

        // Find the corresponding image index (count of system messages up to this point)
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
  const totalSpreads = Math.ceil(totalScenes / 2);

  // Calculate which scenes are visible on current spread
  const leftSceneIndex = currentSpread * 2;
  const rightSceneIndex = currentSpread * 2 + 1;
  const leftScene = scenes[leftSceneIndex] || null;
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

  const handlePageJump = (e) => {
    e.preventDefault();
    const sceneNum = parseInt(jumpToPage);
    if (sceneNum >= 1 && sceneNum <= totalScenes) {
      // Calculate which spread contains this scene
      const targetSpread = Math.floor((sceneNum - 1) / 2);
      setCurrentSpread(targetSpread);
      setJumpToPage('');
      setShowPageJump(false);
    }
  };

  const toggleImageModal = (imageUrl) => {
    setSelectedImg(imageUrl);
    setImageModalOpen(!isImageModalOpen);
  };

  // Swipe gesture detection
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    if (!touchStartX.current || !touchStartY.current) return;

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const deltaX = touchStartX.current - touchEndX;
    const deltaY = touchStartY.current - touchEndY;

    // Only trigger if horizontal swipe is dominant
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      if (deltaX > 0) {
        // Swiped left - go forward
        handleNextSpread();
      } else {
        // Swiped right - go back
        handlePrevSpread();
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
  };

  // Track scene count to detect new content
  useEffect(() => {
    if (scenes.length > previousSceneCount) {
      setPreviousSceneCount(scenes.length);
      // Jump to the last spread when new content arrives
      const lastSpread = Math.ceil(scenes.length / 2) - 1;
      setCurrentSpread(lastSpread);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenes.length]);

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

  return (
    <div className="book-view-container" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      {/* Close button */}
      <button className="book-close-button" onClick={onClose}>
        ✕ Exit Book View
      </button>

      {/* Book - Two-Page Spread */}
      <div className={`book ${isFlipping ? `flipping-${flipDirection}` : ''}`}>
        {/* Left Page */}
        <div className="page page-left">
          {leftScene ? (
            <>
              {/* Image or Loading Placeholder */}
              <div className="page-image-wrapper-large">
                {leftScene.image ? (
                  <img
                    src={leftScene.image}
                    alt="Story scene"
                    className="page-image-large"
                    onClick={() => toggleImageModal(leftScene.image)}
                    style={{ cursor: 'pointer' }}
                  />
                ) : (
                  <div className="page-image-placeholder">
                    <div className="page-image-placeholder-icon">✨</div>
                    <div className="page-image-placeholder-text">Drawing your dream...</div>
                  </div>
                )}
              </div>

              {/* Story Text with Action */}
              <div className="page-text-content">
                {leftScene.text ? (
                  <>
                    {leftScene.action && (
                      <div className="page-story-action">{leftScene.action}</div>
                    )}
                    <div className="page-story-text">{leftScene.text}</div>
                  </>
                ) : (
                  <div className="page-text-placeholder">
                    The story unfolds as ink meets parchment...
                  </div>
                )}
              </div>

              {/* Page Number */}
              <div className="page-number">{leftSceneIndex + 1}</div>
            </>
          ) : (
            <div className="page-content empty">
              <div className="book-cover-text">Dream Weaver</div>
            </div>
          )}
        </div>

        {/* Book Spine */}
        <div className="book-spine"></div>

        {/* Right Page */}
        <div className="page page-right">
          {rightScene ? (
            <>
              {/* Image or Loading Placeholder */}
              <div className="page-image-wrapper-large">
                {rightScene.image ? (
                  <img
                    src={rightScene.image}
                    alt="Story scene"
                    className="page-image-large"
                    onClick={() => toggleImageModal(rightScene.image)}
                    style={{ cursor: 'pointer' }}
                  />
                ) : (
                  <div className="page-image-placeholder">
                    <div className="page-image-placeholder-icon">✨</div>
                    <div className="page-image-placeholder-text">Drawing your dream...</div>
                  </div>
                )}
              </div>

              {/* Story Text with Action */}
              <div className="page-text-content">
                {rightScene.text ? (
                  <>
                    {rightScene.action && (
                      <div className="page-story-action">{rightScene.action}</div>
                    )}
                    <div className="page-story-text">{rightScene.text}</div>
                  </>
                ) : (
                  <div className="page-text-placeholder">
                    The story unfolds as ink meets parchment...
                  </div>
                )}
              </div>

              {/* Page Number */}
              <div className="page-number">{rightSceneIndex + 1}</div>
            </>
          ) : (
            <div className="page-content empty">
              <div className="end-of-story">End of Story</div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation controls */}
      <div className="book-controls">
        {/* Previous page button */}
        <button
          className="page-nav-button prev"
          onClick={handlePrevSpread}
          disabled={!canGoBack || isFlipping}
        >
          ‹
        </button>

        {/* Page counter */}
        <div className="page-counter">
          <span className="current-pages">
            {leftSceneIndex + 1}
            {rightScene && `-${rightSceneIndex + 1}`}
          </span>
          <span className="page-divider">/</span>
          <span className="total-pages">{totalScenes}</span>
          <button
            className="jump-to-page-button"
            onClick={() => setShowPageJump(!showPageJump)}
          >
            Jump to Scene
          </button>
        </div>

        {/* Next page button */}
        <button
          className="page-nav-button next"
          onClick={handleNextSpread}
          disabled={!canGoForward || isFlipping}
        >
          ›
        </button>
      </div>

      {/* Page jump modal */}
      {showPageJump && (
        <div className="page-jump-modal">
          <form onSubmit={handlePageJump}>
            <input
              type="number"
              min="1"
              max={totalScenes}
              value={jumpToPage}
              onChange={(e) => setJumpToPage(e.target.value)}
              placeholder={`1-${totalScenes}`}
              className="page-jump-input"
              autoFocus
            />
            <button type="submit" className="page-jump-submit">Go</button>
            <button
              type="button"
              onClick={() => setShowPageJump(false)}
              className="page-jump-cancel"
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      {/* Actions (shown when on the last spread) */}
      {currentSpread === totalSpreads - 1 && (
        <div className="book-actions">
          <h3>What happens next?</h3>

          <div className="book-actions-container">
            {/* Predefined actions */}
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

            {/* Custom action input */}
            <form onSubmit={handleCustomAction} className="custom-action-form">
              <input
                type="text"
                value={customAction}
                onChange={(e) => setCustomAction(e.target.value)}
                placeholder="Or type your own action..."
                className="custom-action-input"
              />
              <button type="submit" className="custom-action-submit">
                Continue
              </button>
            </form>
          </div>
        </div>
      )}

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
