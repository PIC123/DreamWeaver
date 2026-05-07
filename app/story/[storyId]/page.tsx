'use client';

import { useState, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useStoryEngine } from '@/hooks/useStoryEngine';
import StoryHeader from '@/components/story/StoryHeader';
import StoryImagePanel from '@/components/story/StoryImagePanel';
import StoryChat from '@/components/story/StoryChat';
import StoryActions from '@/components/story/StoryActions';
import StoryInputBar from '@/components/story/StoryInputBar';
import BookView from '@/components/story/BookView';
import '../Story.css';

type Params = Promise<{ storyId: string }>;

export default function StoryPage({ params }: { params: Params }) {
  const { storyId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSetting = searchParams.get('setting') ?? undefined;

  const [isBookViewOpen, setIsBookViewOpen] = useState(false);
  const { state, submitTurn } = useStoryEngine({ storyId, initialSetting });

  const {
    ready,
    setting,
    messages,
    storyImages,
    imgUrl,
    possibleActions,
    isStoryLoading,
    isImageLoading,
    errorMessage,
  } = state;

  if (!ready) {
    return (
      <div className="story-container" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div className="loading-text">Conjuring your story...</div>
      </div>
    );
  }

  if (errorMessage && messages.length === 0) {
    return (
      <div className="story-container" style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Story unavailable</h2>
        <p style={{ color: '#c7b8ea' }}>{errorMessage}</p>
        <button className="back-button" type="button" onClick={() => router.push('/')}>
          ← Back to Menu
        </button>
      </div>
    );
  }

  return (
    <div className="story-container">
      <div
        className="overlay"
        style={{ backgroundImage: imgUrl ? `url(${imgUrl})` : 'none' }}
      />

      <StoryHeader
        setting={setting}
        storyId={storyId}
        onOpenBookView={() => setIsBookViewOpen(true)}
        bookViewDisabled={messages.length === 0}
      />

      <div className="main-content">
        <StoryImagePanel
          imgUrl={imgUrl}
          storyImages={storyImages}
          isImageLoading={isImageLoading}
        />

        <div className="chat-section">
          <StoryChat messages={messages} />
          <StoryActions
            actions={possibleActions}
            disabled={isStoryLoading}
            onActionClick={submitTurn}
          />
          <StoryInputBar disabled={isStoryLoading} onSubmit={submitTurn} />

          <div className="bottom-controls">
            <button onClick={() => router.push('/')} className="back-button" type="button">
              ← Back to Menu
            </button>
          </div>
        </div>
      </div>

      {isBookViewOpen && (
        <BookView
          messages={messages}
          storyImages={storyImages}
          possibleActions={possibleActions}
          onActionClick={submitTurn}
          onClose={() => setIsBookViewOpen(false)}
        />
      )}
    </div>
  );
}
