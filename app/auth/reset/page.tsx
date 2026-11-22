'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import '@/components/auth/AuthModal.css';

/** Where the password-reset email link lands. Supabase signs the visitor in first. */
export default function ResetPasswordPage() {
  const { isGuest, loading, updatePassword } = useAuth();
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const result = await updatePassword(password);
    setBusy(false);
    if (result.error) setError(result.error);
    else setDone(true);
  };

  return (
    <div className="auth-modal-overlay" style={{ position: 'relative', minHeight: '100dvh' }}>
      <div className="auth-modal-content">
        <h1 className="auth-modal-title">Choose a New Password</h1>
        {done ? (
          <>
            <p className="auth-modal-subtitle">Your password has been updated.</p>
            <Link
              href="/dashboard"
              className="auth-submit-button"
              style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}
            >
              Go to my stories
            </Link>
          </>
        ) : loading ? (
          <p className="auth-modal-subtitle">One moment…</p>
        ) : isGuest ? (
          <>
            <p className="auth-modal-subtitle">
              This reset link has expired or was already used. Request a new one from the sign-in
              screen.
            </p>
            <Link
              href="/"
              className="auth-toggle-button"
              style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}
            >
              Back to DreamWeaver
            </Link>
          </>
        ) : (
          <form onSubmit={submit} className="auth-form">
            <div className="auth-input-group">
              <label htmlFor="new-password">New password</label>
              <input
                id="new-password"
                type="password"
                className="auth-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
                disabled={busy}
                autoComplete="new-password"
              />
            </div>
            {error && (
              <div className="auth-error" role="alert">
                {error}
              </div>
            )}
            <button type="submit" className="auth-submit-button" disabled={busy}>
              {busy ? '✨ Saving…' : 'Save Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
