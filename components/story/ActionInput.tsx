'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { LIMITS } from '@/lib/story/types';
import styles from './story.module.css';

// The Web Speech API is not in TypeScript's DOM types yet.
type SpeechResult = { isFinal: boolean; 0: { transcript: string } };
type SpeechEvent = { resultIndex: number; results: ArrayLike<SpeechResult> };
type Recognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
};
type RecognitionCtor = new () => Recognition;

function recognitionCtor(): RecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

type Props = {
  disabled: boolean;
  onSubmit: (action: string) => void;
  placeholder?: string;
};

/** Free-text action box with optional voice dictation where the browser supports it. */
export default function ActionInput({ disabled, onSubmit, placeholder }: Props) {
  const [value, setValue] = useState('');
  const [listening, setListening] = useState(false);
  const [canListen, setCanListen] = useState(false);
  const recognition = useRef<Recognition | null>(null);

  useEffect(() => {
    // Feature-detect after mount so server and first client render agree.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCanListen(recognitionCtor() !== null);
    return () => recognition.current?.stop();
  }, []);

  const toggleListening = () => {
    if (listening) {
      recognition.current?.stop();
      return;
    }
    const Ctor = recognitionCtor();
    if (!Ctor) return;
    const rec = new Ctor();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = navigator.language || 'en-US';
    rec.onresult = (event) => {
      let heard = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) heard += event.results[i][0].transcript;
      }
      if (heard) {
        setValue((prev) => `${prev} ${heard}`.trim().slice(0, LIMITS.actionMaxLength));
      }
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recognition.current = rec;
    rec.start();
    setListening(true);
  };

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const action = value.trim();
    if (!action || disabled) return;
    onSubmit(action);
    setValue('');
  };

  return (
    <form className={styles.inputRow} onSubmit={submit}>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        maxLength={LIMITS.actionMaxLength}
        placeholder={placeholder ?? 'Or describe what you do…'}
        aria-label="Describe what you do next"
        disabled={disabled}
        className={styles.input}
        enterKeyHint="send"
      />
      {canListen && (
        <button
          type="button"
          className={`${styles.iconButton} ${listening ? styles.listening : ''}`}
          onClick={toggleListening}
          disabled={disabled}
          aria-pressed={listening}
          aria-label={listening ? 'Stop listening' : 'Speak your action'}
          title={listening ? 'Stop listening' : 'Speak your action'}
        >
          {listening ? '⏹' : '🎤'}
        </button>
      )}
      <button type="submit" className={styles.primaryButton} disabled={disabled || !value.trim()}>
        Send
      </button>
    </form>
  );
}
