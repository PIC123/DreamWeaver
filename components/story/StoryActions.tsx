'use client';

function formatActionText(text: string): string {
  return text
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

type Props = {
  actions: string[];
  disabled: boolean;
  onActionClick: (action: string) => void;
};

export default function StoryActions({ actions, disabled, onActionClick }: Props) {
  if (actions.length === 0) return null;
  return (
    <div className="actions-container">
      {actions.map((action, index) => (
        <button
          key={`${index}-${action}`}
          type="button"
          onClick={() => onActionClick(action)}
          disabled={disabled}
        >
          {formatActionText(action)}
        </button>
      ))}
    </div>
  );
}
