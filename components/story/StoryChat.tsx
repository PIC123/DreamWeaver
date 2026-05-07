'use client';

import { useEffect, useRef } from 'react';
import type { DisplayMessage } from '@/types/story';

type Props = { messages: DisplayMessage[] };

export default function StoryChat({ messages }: Props) {
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="message-container" role="log" aria-live="polite">
      {messages.map((message, index) => (
        <div
          key={index}
          className={message.sender === 'human' ? 'user-message' : 'system-message'}
        >
          {message.text}
        </div>
      ))}
      <div ref={endRef} />
    </div>
  );
}
