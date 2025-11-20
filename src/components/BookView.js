import React, { useState, useEffect, useRef } from 'react';
import $ from 'jquery';
import 'turn.js';
import './BookView.css';

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
  const bookRef = useRef(null);
  const turnInitialized = useRef(false);

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
    if (bookRef.current && !turnInitialized.current && scenes.length > 0) {
      const $book = $(bookRef.current);

      $book.turn({
        width: 1400,
        height: 700,
        autoCenter: true,
        gradients: true,
        acceleration: true,
        elevation: 50,
        display: 'double',
        when: {
          turned: function(_event, page) {
            setCurrentPage(page);
          }
        }
      });

      turnInitialized.current = true;
    }

    return () => {
      if (turnInitialized.current && bookRef.current) {
        try {
          $(bookRef.current).turn('destroy');
          turnInitialized.current = false;
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    };
  }, [scenes.length]);

  // Jump to last page when new content arrives
  useEffect(() => {
    if (scenes.length > previousSceneCount && turnInitialized.current && bookRef.current) {
      setPreviousSceneCount(scenes.length);
      const $book = $(bookRef.current);
      setTimeout(() => {
        $book.turn('page', scenes.length + 1); // +1 for cover
      }, 100);
    }
  }, [scenes.length, previousSceneCount]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!turnInitialized.current || !bookRef.current) return;

      const $book = $(bookRef.current);
      if (e.key === 'ArrowLeft') $book.turn('previous');
      if (e.key === 'ArrowRight') $book.turn('next');
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const nextPage = () => {
    if (bookRef.current) {
      $(bookRef.current).turn('next');
    }
  };

  const prevPage = () => {
    if (bookRef.current) {
      $(bookRef.current).turn('previous');
    }
  };

  return (
    <div className="book-view-container">
      {/* Close button */}
      <button className="book-close-button" onClick={onClose}>
        ✕ Exit Book View
      </button>

      {/* Turn.js Book */}
      <div className="turn-book-wrapper">
        <div ref={bookRef} id="flipbook" className="turn-book">
          {/* Cover Page */}
          <div className="turn-page">
            <div className="book-cover">
              <div className="book-cover-title">Dream Weaver</div>
              <div className="book-cover-subtitle">An Interactive Storybook</div>
              <div className="book-cover-ornament">✨</div>
            </div>
          </div>

          {/* Story Pages */}
          {scenes.map((scene, index) => (
            <div key={index} className="turn-page">
              <div className="page page-single">
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

                {/* Page Number */}
                <div className="page-number">{index + 1}</div>
              </div>
            </div>
          ))}

          {/* Last Page - Actions */}
          <div className="turn-page">
            <div className="page page-single">
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
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="book-nav-controls">
        <button
          className="nav-button nav-prev"
          onClick={prevPage}
        >
          ← Previous
        </button>

        <div className="page-indicator">
          Page {currentPage} of {scenes.length + 2}
        </div>

        <button
          className="nav-button nav-next"
          onClick={nextPage}
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
