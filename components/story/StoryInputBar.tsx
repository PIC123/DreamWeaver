'use client';

import { useState, type KeyboardEvent } from 'react';

type Props = {
  disabled: boolean;
  onSubmit: (input: string) => void;
};

export default function StoryInputBar({ disabled, onSubmit }: Props) {
  const [input, setInput] = useState('');

  const handleSubmit = () => {
    if (!input.trim()) return;
    onSubmit(input);
    setInput('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <div className="input-controls">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        className="message-input"
        placeholder="Describe your action..."
        disabled={disabled}
        aria-label="Describe your action"
      />
      <button
        onClick={handleSubmit}
        className="submit-button"
        disabled={disabled || !input.trim()}
        type="button"
      >
        {disabled ? '✨' : 'Send'}
      </button>
    </div>
  );
}
