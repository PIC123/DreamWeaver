import React, { useState, useEffect, useRef } from 'react';
import './BookView.css';

export default function BookView({
  messages,
  storyImages,
  possibleActions,
  onActionClick,
  onClose
}) {
  const bookRef = useRef(null);
  const [customAction, setCustomAction] = useState('');
  const [isImageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImg, setSelectedImg] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  // Convert messages to scenes - first scene is the cover with story setting
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
          action: userAction,
          isFirst: systemMessageIndex === 0
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

  // Initialize turn.js
  useEffect(() => {
    if (bookRef.current && window.$ && scenes.length > 0) {
      const $book = window.$(bookRef.current);

      // Destroy existing instance if it exists
      if ($book.turn('is')) {
        $book.turn('destroy');
      }

      // Initialize turn.js
      $book.turn({
        display: 'double',
        acceleration: true,
        gradients: true,
        duration: 600,
        when: {
          turned: function(_e, page) {
            setCurrentPage(page);
          }
        }
      });

      setTotalPages($book.turn('pages'));

      // Jump to last page when new content arrives
      setTimeout(() => {
        const lastPage = $book.turn('pages');
        $book.turn('page', lastPage);
      }, 100);

      return () => {
        if ($book.turn('is')) {
          $book.turn('destroy');
        }
      };
    }
  }, [scenes.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft' && bookRef.current && window.$) {
        window.$(bookRef.current).turn('previous');
      }
      if (e.key === 'ArrowRight' && bookRef.current && window.$) {
        window.$(bookRef.current).turn('next');
      }
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handlePrevious = () => {
    if (bookRef.current && window.$) {
      window.$(bookRef.current).turn('previous');
    }
  };

  const handleNext = () => {
    if (bookRef.current && window.$) {
      window.$(bookRef.current).turn('next');
    }
  };

  // Render a single page
  const renderPage = (scene, index) => {
    // First page - story setting as cover
    if (scene.isFirst) {
      return (
        <div key={index} className="turn-page page page-cover">
          <div className="book-cover">
            <div className="book-cover-ornament">✨</div>
            <div className="book-cover-title">Your Story Begins</div>
            <div className="book-cover-story-setting">{scene.text}</div>
          </div>
        </div>
      );
    }

    // Regular story page
    return (
      <div key={index} className="turn-page page">
        <div className="page-image-wrapper">
          {scene.image ? (
            <img
              src={scene.image}
              alt="Story scene"
              className="page-image"
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
          {scene.action && (
            <div className="page-story-action">{scene.action}</div>
          )}
          <div className="page-story-text">{scene.text}</div>
        </div>

        <div className="page-number">{index + 1}</div>
      </div>
    );
  };

  // Render actions page (last page)
  const renderActionsPage = () => {
    return (
      <div key="actions" className="turn-page page">
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
      </div>
    );
  };

  return (
    <div className="book-view-container">
      <button className="book-close-button" onClick={onClose}>
        ✕ Exit Book View
      </button>

      <div className="book-wrapper">
        <div ref={bookRef} id="book" className="book">
          {scenes.map((scene, index) => renderPage(scene, index))}
          {renderActionsPage()}
        </div>
      </div>

      {/* Navigation Controls - Below the book */}
      <div className="book-nav-controls">
        <button
          className="nav-button nav-prev"
          onClick={handlePrevious}
        >
          ← Previous
        </button>

        <div className="page-indicator">
          Page {currentPage} of {totalPages}
        </div>

        <button
          className="nav-button nav-next"
          onClick={handleNext}
        >
          Next →
        </button>
      </div>

      {/* Image Modal */}
      {isImageModalOpen && (
        <div className="book-image-modal" onClick={() => toggleImageModal('')}>
          <img src={selectedImg} alt="Enlarged Scene" className="book-enlarged-image" />
        </div>
      )}
    </div>
  );
}
