'use client';

import { useState } from 'react';

type Props = {
  imgUrl: string | null;
  storyImages: string[];
  isImageLoading: boolean;
};

export default function StoryImagePanel({ imgUrl, storyImages, isImageLoading }: Props) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [enlargedSrc, setEnlargedSrc] = useState<string | null>(null);

  return (
    <div className="image-section">
      <div className="image-container">
        {imgUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imgUrl}
            alt="Story scene"
            className="story-image"
            onClick={() => setEnlargedSrc(imgUrl)}
          />
        ) : (
          <div className="image-placeholder">
            <div className="loading-text">Awaiting your first scene...</div>
          </div>
        )}
        {isImageLoading && (
          <div className="image-loading-overlay">
            <div className="spinner" />
            <div className="loading-text">Painting your scene...</div>
          </div>
        )}
      </div>

      {storyImages.length > 0 && (
        <>
          <div className="image-section-header">
            <h3>Story Gallery</h3>
            <button
              type="button"
              className="collapse-toggle"
              onClick={() => setIsCollapsed((v) => !v)}
              aria-label={isCollapsed ? 'Expand gallery' : 'Collapse gallery'}
            >
              {isCollapsed ? '▼' : '▲'}
            </button>
          </div>
          <div className={`image-gallery ${isCollapsed ? 'collapsed' : ''}`}>
            {storyImages.map((image, index) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={`${index}-${image}`}
                src={image}
                alt={`Scene ${index + 1}`}
                onClick={() => setEnlargedSrc(image)}
                className="gallery-story-image"
              />
            ))}
          </div>
        </>
      )}

      {enlargedSrc && (
        <div
          className="image-modal"
          onClick={() => setEnlargedSrc(null)}
          role="dialog"
          aria-modal="true"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={enlargedSrc} alt="Enlarged scene" className="enlarged-image" />
        </div>
      )}
    </div>
  );
}
