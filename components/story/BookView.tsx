'use client';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from 'react';
import Script from 'next/script';
import type { DisplayMessage } from '@/types/story';
import './BookView.css';

type Props = {
  messages: DisplayMessage[];
  storyImages: string[];
  possibleActions: string[];
  onActionClick: (action: string) => void;
  onClose: () => void;
};

type Scene = {
  text: string;
  image: string | null;
  action: string | null;
  isFirst: boolean;
};

type TurnableJQuery = {
  turn: (...args: unknown[]) => unknown;
};

type Win = typeof window & {
  $?: (selector: HTMLElement | string) => TurnableJQuery;
  jQuery?: unknown;
};

function buildScenes(messages: DisplayMessage[], storyImages: string[]): Scene[] {
  const scenes: Scene[] = [];
  let systemSeen = 0;
  for (let i = 0; i < messages.length; i++) {
    const m = messages[i];
    if (m.sender !== 'system') continue;
    // Walk back to find the most recent human message
    let action: string | null = null;
    for (let j = i - 1; j >= 0; j--) {
      if (messages[j].sender === 'human') {
        action = messages[j].text;
        break;
      }
    }
    scenes.push({
      text: m.text,
      image: storyImages[systemSeen] ?? null,
      action,
      isFirst: systemSeen === 0,
    });
    systemSeen++;
  }
  return scenes;
}

export default function BookView({
  messages,
  storyImages,
  possibleActions,
  onActionClick,
  onClose,
}: Props) {
  const bookRef = useRef<HTMLDivElement | null>(null);
  const [customAction, setCustomAction] = useState('');
  const [enlargedSrc, setEnlargedSrc] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scriptsReady, setScriptsReady] = useState(
    () => typeof window !== 'undefined' && !!(window as Win).$,
  );

  const scenes = useMemo(() => buildScenes(messages, storyImages), [messages, storyImages]);

  const handleCustomAction = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (customAction.trim()) {
      onActionClick(customAction.trim());
      setCustomAction('');
    }
  };

  // Initialise turn.js once the scripts are ready and we have content
  useEffect(() => {
    if (!scriptsReady) return;
    const win = window as Win;
    const $ = win.$;
    if (!$ || !bookRef.current || scenes.length === 0) return;

    const $book = $(bookRef.current);
    let initialised = false;
    try {
      $book.turn('pages');
      initialised = true;
    } catch {
      try {
        $book.turn({
          display: 'double',
          acceleration: true,
          gradients: true,
          duration: 600,
          when: {
            turned: (_e: unknown, page: number) => setCurrentPage(page),
          },
        });
        initialised = true;
        setTotalPages($book.turn('pages') as number);
      } catch (initErr) {
        console.error('turn.js init failed', initErr);
      }
    }

    return () => {
      if (!initialised) return;
      try {
        $book.turn('destroy');
      } catch {
        /* already destroyed */
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scriptsReady]);

  // Jump to last page when new content arrives
  useEffect(() => {
    if (!scriptsReady) return;
    const win = window as Win;
    const $ = win.$;
    if (!$ || !bookRef.current || scenes.length === 0) return;

    const $book = $(bookRef.current);
    const timer = setTimeout(() => {
      try {
        const last = $book.turn('pages') as number;
        $book.turn('page', last);
        setTotalPages(last);
      } catch {
        /* not initialised yet */
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [scenes.length, scriptsReady]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const win = window as Win;
      const $ = win.$;
      if (!$ || !bookRef.current) return;
      if (e.key === 'ArrowLeft') $(bookRef.current).turn('previous');
      if (e.key === 'ArrowRight') $(bookRef.current).turn('next');
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const navigate = (direction: 'previous' | 'next') => {
    const win = window as Win;
    const $ = win.$;
    if ($ && bookRef.current) {
      $(bookRef.current).turn(direction);
    }
  };

  return (
    <div className="book-view-container">
      <Script
        src="https://code.jquery.com/jquery-3.7.1.min.js"
        strategy="afterInteractive"
        onReady={() => {
          if ((window as Win).$) setScriptsReady(false);
        }}
        onLoad={() => {
          // Once jQuery is loaded, ensure turn.js loads next.
        }}
      />
      <Script
        src="/turn.js-master/turn.js"
        strategy="afterInteractive"
        onLoad={() => setScriptsReady(true)}
      />

      <button className="book-close-button" onClick={onClose} type="button">
        ✕ Exit Book View
      </button>

      <div className="book-wrapper">
        <div ref={bookRef} id="book" className="book">
          <div key="cover" className="turn-page page page-cover">
            <div className="book-cover">
              <div className="book-cover-ornament">✨</div>
              <div className="book-cover-title">Dream Weaver</div>
              <div className="book-cover-subtitle">An Interactive Storybook</div>
            </div>
          </div>
          {scenes.map((scene, index) => (
            <div key={index} className="turn-page page">
              <div className="page-image-wrapper">
                {scene.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={scene.image}
                    alt="Story scene"
                    className="page-image"
                    onClick={() => setEnlargedSrc(scene.image)}
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
                {scene.action && <div className="page-story-action">{scene.action}</div>}
                <div className="page-story-text">{scene.text}</div>
              </div>

              <div className="page-number">{index + 1}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="book-nav-controls">
        <button
          type="button"
          className="nav-button nav-prev"
          onClick={() => navigate('previous')}
        >
          ← Previous
        </button>
        <div className="page-indicator">
          Page {currentPage} of {totalPages}
        </div>
        <button
          type="button"
          className="nav-button nav-next"
          onClick={() => navigate('next')}
        >
          Next →
        </button>
      </div>

      <div className="book-actions-container">
        <h3 className="actions-title">What happens next?</h3>

        {possibleActions && possibleActions.length > 0 && (
          <div className="book-actions-grid">
            {possibleActions.map((action, index) => (
              <button
                key={`${index}-${action}`}
                type="button"
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
            aria-label="Custom action"
          />
          <button type="submit" className="custom-action-submit">
            Continue Story
          </button>
        </form>
      </div>

      {enlargedSrc && (
        <div
          className="book-image-modal"
          onClick={() => setEnlargedSrc(null)}
          role="dialog"
          aria-modal="true"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={enlargedSrc} alt="Enlarged scene" className="book-enlarged-image" />
        </div>
      )}
    </div>
  );
}
