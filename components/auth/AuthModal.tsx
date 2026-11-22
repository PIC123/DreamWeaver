'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from './AuthProvider';
import './AuthModal.css';

export type AuthMode = 'login' | 'signup' | 'forgot';

type Props = {
  mode: AuthMode;
  onClose: () => void;
};

const COPY: Record<AuthMode, { title: string; subtitle: string; submit: string }> = {
  login: {
    title: 'Welcome Back',
    subtitle: 'Sign in to open your bookshelf',
    submit: 'Sign In',
  },
  signup: {
    title: 'Begin Your Journey',
    subtitle: 'Create an account to keep your stories on every device',
    submit: 'Create Account',
  },
  forgot: {
    title: 'Forgot Your Password?',
    subtitle: "Enter your email and we'll send you a reset link",
    submit: 'Send Reset Link',
  },
};

/** Render this only while it should be open; it starts in the mode it is given. */
export default function AuthModal({ mode: initialMode, onClose }: Props) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const { signIn, signUp, sendPasswordReset } = useAuth();

  useEffect(() => {
    emailRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const switchTo = (next: AuthMode) => {
    setMode(next);
    setError('');
    setMessage('');
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setBusy(true);
    try {
      if (mode === 'login') {
        const result = await signIn(email, password);
        if (result.error) setError(result.error);
        else onClose();
      } else if (mode === 'signup') {
        const result = await signUp(email, password);
        if (result.error) setError(result.error);
        else if (result.needsEmailConfirmation) {
          setMessage('Check your email for a confirmation link. Your stories will be waiting.');
        } else onClose();
      } else {
        const result = await sendPasswordReset(email);
        if (result.error) setError(result.error);
        else setMessage('If that email has an account, a reset link is on its way.');
      }
    } finally {
      setBusy(false);
    }
  };

  const copy = COPY[mode];

  // Rendered at the end of <body> so no ancestor's layout can clip or offset it.
  return createPortal(
    <div className="auth-modal-overlay" onClick={onClose}>
      <div
        className="auth-modal-content"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="auth-modal-close" onClick={onClose} aria-label="Close">
          ✕
        </button>

        <h2 id="auth-modal-title" className="auth-modal-title">
          {copy.title}
        </h2>
        <p className="auth-modal-subtitle">{copy.subtitle}</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-input-group">
            <label htmlFor="auth-email">Email</label>
            <input
              ref={emailRef}
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="auth-input"
              required
              disabled={busy}
              autoComplete="email"
            />
          </div>

          {mode !== 'forgot' && (
            <div className="auth-input-group">
              <label htmlFor="auth-password">Password</label>
              <input
                id="auth-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="auth-input"
                required
                disabled={busy}
                minLength={6}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </div>
          )}

          {error && (
            <div className="auth-error" role="alert">
              {error}
            </div>
          )}
          {message && (
            <div className="auth-message" role="status">
              {message}
            </div>
          )}

          <button type="submit" className="auth-submit-button" disabled={busy}>
            {busy ? '✨ One moment…' : copy.submit}
          </button>
        </form>

        {mode === 'login' && (
          <button type="button" className="auth-link-button" onClick={() => switchTo('forgot')}>
            Forgot your password?
          </button>
        )}

        <div className="auth-divider">
          <span>or</span>
        </div>

        <button
          type="button"
          className="auth-toggle-button"
          onClick={() => switchTo(mode === 'login' ? 'signup' : 'login')}
          disabled={busy}
        >
          {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>,
    document.body,
  );
}
