'use client';

type Props = {
  setting: string;
  storyId: string;
  onOpenBookView: () => void;
  bookViewDisabled: boolean;
};

export default function StoryHeader({
  setting,
  storyId,
  onOpenBookView,
  bookViewDisabled,
}: Props) {
  return (
    <div className="story-header">
      <h2 className="story-intro">Welcome to {setting}</h2>
      <div className="header-controls">
        <button
          onClick={onOpenBookView}
          className="book-view-toggle"
          disabled={bookViewDisabled}
          title="Open Book View"
          type="button"
        >
          📖 Book View
        </button>
        <h4 className="story-id">ID: {storyId}</h4>
      </div>
    </div>
  );
}
