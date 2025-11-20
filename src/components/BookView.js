import React, { useState, useEffect, useRef } from 'react';
import HTMLFlipBook from 'react-pageflip';
import './BookView.css';

// Page component for the flip book
const Page = React.forwardRef(({ children, pageNumber }, ref) => {
  return (
    <div className="book-page" ref={ref}>
      <div className="page-content">
        {children}
      </div>
      {pageNumber !== undefined && (
        <div className="page-number-bottom">{pageNumber}</div>
      )}
    </div>
  );
});

Page.displayName = 'Page';

export default function BookView({
  messages,
  storyImages,
  possibleActions,
  onActionClick,
  onClose
}) {
  const [customAction, setCustomAction] = useState('');
  const [previousSceneCount, setPreviousSceneCount] = useState(0);
  const [isImageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImg, setSelectedImg] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const bookRef = useRef(null);

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

        // Find the corresponding image index
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

  const nextPage = () => {
    bookRef.current?.pageFlip()?.flipNext();
  };

  const prevPage = () => {
    bookRef.current?.pageFlip()?.flipPrev();
  };

  const onFlip = (e) => {
    setCurrentPage(e.data);
  };

  // Track scene count to jump to last page when new content arrives
  useEffect(() => {
    if (scenes.length > previousSceneCount && bookRef.current) {
      setPreviousSceneCount(scenes.length);
      // Jump to the last page when new content arrives
      const lastPageIndex = scenes.length; // +1 for cover, but 0-indexed
      setTimeout(() => {
        bookRef.current?.pageFlip()?.flip(lastPageIndex);
      }, 100);
    }
  }, [scenes.length, previousSceneCount]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') prevPage();
      if (e.key === 'ArrowRight') nextPage();
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="book-view-container">
      {/* Close button */}
      <button className="book-close-button" onClick={onClose}>
        ✕ Exit Book View
      </button>

      {/* Flip Book */}
      <div className="flip-book-wrapper">
        <HTMLFlipBook
          ref={bookRef}
          width={450}
          height={600}
          size="stretch"
          minWidth={315}
          maxWidth={1000}
          minHeight={420}
          maxHeight={1350}
          showCover={true}
          mobileScrollSupport={true}
          onFlip={onFlip}
          onChangeOrientation={() => {}}
          onChangeState={(e) => setTotalPages(e.data)}
          className="flip-book"
          style={{}}
          startPage={0}
          drawShadow={true}
          flippingTime={1000}
          usePortrait={true}
          startZIndex={0}
          autoSize={true}
          maxShadowOpacity={0.5}
          showPageCorners={true}
          disableFlipByClick={false}
        >
          {/* Cover Page */}
          <Page pageNumber={undefined}>
            <div className="book-cover">
              <div className="book-cover-title">Dream Weaver</div>
              <div className="book-cover-subtitle">An Interactive Storybook</div>
              <div className="book-cover-ornament">✨</div>
            </div>
          </Page>

          {/* Story Pages */}
          {scenes.map((scene, index) => (
            <Page key={index} pageNumber={index + 1}>
              <div className="page-scene">
                {/* Image */}
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

                {/* Story Text with Action */}
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
              </div>
            </Page>
          ))}

          {/* Last Page - Actions */}
          <Page pageNumber={scenes.length + 1}>
            <div className="book-last-page">
              <h3 className="last-page-title">What happens next?</h3>

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
                  Continue Story
                </button>
              </form>
            </div>
          </Page>
        </HTMLFlipBook>
      </div>

      {/* Navigation Controls */}
      <div className="book-nav-controls">
        <button
          className="nav-button nav-prev"
          onClick={prevPage}
          disabled={currentPage === 0}
        >
          ← Previous
        </button>

        <div className="page-indicator">
          Page {currentPage} of {totalPages}
        </div>

        <button
          className="nav-button nav-next"
          onClick={nextPage}
          disabled={currentPage >= totalPages - 1}
        >
          Next →
        </button>
      </div>

      {/* Corner Click Areas for Navigation */}
      <div className="corner-click-left" onClick={prevPage}></div>
      <div className="corner-click-right" onClick={nextPage}></div>

      {/* Image Modal */}
      {isImageModalOpen && (
        <div className="book-image-modal" onClick={() => toggleImageModal('')}>
          <img src={selectedImg} alt="Enlarged Scene" className="book-enlarged-image" />
        </div>
      )}
    </div>
  );
}
