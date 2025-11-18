import React, { useState, useEffect, useRef } from 'react';
import './BookView.css';

export default function BookView({
  messages,
  storyImages,
  possibleActions,
  onActionClick,
  onClose
}) {
  const [currentSpread, setCurrentSpread] = useState(0); // Which two-page spread we're on
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState('forward'); // 'forward' or 'backward'
  const [showPageJump, setShowPageJump] = useState(false);
  const [jumpToPage, setJumpToPage] = useState('');
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);

  // Convert messages to pages (each message + image = 1 page)
  const pages = messages.map((message, index) => ({
    text: message.text,
    image: storyImages[index] || null,
    sender: message.sender
  }));

  const totalPages = pages.length;
  const totalSpreads = Math.ceil(totalPages / 2);

  // Get the two pages for the current spread
  const leftPageIndex = currentSpread * 2;
  const rightPageIndex = currentSpread * 2 + 1;
  const leftPage = pages[leftPageIndex];
  const rightPage = pages[rightPageIndex];

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

  const handlePageJump = (e) => {
    e.preventDefault();
    const pageNum = parseInt(jumpToPage);
    if (pageNum >= 1 && pageNum <= totalPages) {
      const spreadNum = Math.floor((pageNum - 1) / 2);
      setCurrentSpread(spreadNum);
      setJumpToPage('');
      setShowPageJump(false);
    }
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

      {/* Book */}
      <div className={`book ${isFlipping ? `flipping-${flipDirection}` : ''}`}>
        {/* Left page */}
        <div className="page page-left">
          {leftPage ? (
            <>
              <div className="page-content">
                {leftPage.image && (
                  <div className="page-image-wrapper">
                    <img src={leftPage.image} alt="Story scene" className="page-image" />
                  </div>
                )}
                <div className="page-text">{leftPage.text}</div>
              </div>
              <div className="page-number">{leftPageIndex + 1}</div>
            </>
          ) : (
            <div className="page-content empty">
              <div className="book-cover-text">Dream Weaver</div>
            </div>
          )}
        </div>

        {/* Book spine */}
        <div className="book-spine"></div>

        {/* Right page */}
        <div className="page page-right">
          {rightPage ? (
            <>
              <div className="page-content">
                {rightPage.image && (
                  <div className="page-image-wrapper">
                    <img src={rightPage.image} alt="Story scene" className="page-image" />
                  </div>
                )}
                <div className="page-text">{rightPage.text}</div>
              </div>
              <div className="page-number">{rightPageIndex + 1}</div>
            </>
          ) : (
            <div className="page-content empty">
              <div className="end-of-story">To be continued...</div>
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
            {leftPageIndex + 1}
            {rightPage && `-${rightPageIndex + 1}`}
          </span>
          <span className="page-divider">/</span>
          <span className="total-pages">{totalPages}</span>
          <button
            className="jump-to-page-button"
            onClick={() => setShowPageJump(!showPageJump)}
          >
            Jump to Page
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
              max={totalPages}
              value={jumpToPage}
              onChange={(e) => setJumpToPage(e.target.value)}
              placeholder={`1-${totalPages}`}
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

      {/* Actions (shown when on the last page) */}
      {currentSpread === totalSpreads - 1 && possibleActions && possibleActions.length > 0 && (
        <div className="book-actions">
          <h3>What happens next?</h3>
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
    </div>
  );
}
