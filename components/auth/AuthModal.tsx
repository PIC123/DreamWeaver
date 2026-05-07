'use client';

import { useState, type FormEvent } from 'react';
import { useAuth } from './AuthProvider';
import './AuthModal.css';

type Mode = 'login' | 'signup';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  mode?: Mode;
};

export default function AuthModal({ isOpen, onClose, mode: initialMode = 'login' }: Props) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const { signIn, signUp } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const { error: signInError } = await signIn(email, password);
        if (signInError) throw signInError;
        onClose();
      } else {
        const { error: signUpError } = await signUp(email, password);
        if (signUpError) throw signUpError;
        setMessage('Check your email for the confirmation link!');
        setTimeout(() => onClose(), 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    setError('');
    setMessage('');
  };

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="auth-modal-close" onClick={onClose} aria-label="Close">
          ✕
        </button>

        <h2 className="auth-modal-title">
          {mode === 'login' ? 'Welcome Back' : 'Begin Your Journey'}
        </h2>
        <p className="auth-modal-subtitle">
          {mode === 'login'
            ? 'Sign in to access your saved stories'
            : 'Create an account to save your adventures'}
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-input-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="auth-input"
              required
              disabled={loading}
              autoComplete="email"
            />
          </div>

          <div className="auth-input-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="auth-input"
              required
              disabled={loading}
              minLength={6}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </div>

          {error && <div className="auth-error">{error}</div>}
          {message && <div className="auth-message">{message}</div>}

          <button type="submit" className="auth-submit-button" disabled={loading}>
            {loading ? (
              <span className="auth-loading">✨ Loading...</span>
            ) : mode === 'login' ? (
              'Sign In'
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <button
          type="button"
          className="auth-toggle-button"
          onClick={toggleMode}
          disabled={loading}
        >
          {mode === 'login'
            ? "Don't have an account? Sign up"
            : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  );
}
