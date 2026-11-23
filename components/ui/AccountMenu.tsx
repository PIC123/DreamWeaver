'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import PreferencesDialog from '@/components/account/PreferencesDialog';
import AuthModal, { type AuthMode } from '@/components/auth/AuthModal';

/** Sign in / sign up buttons for guests; an account menu for members. */
export default function AccountMenu({ showShelfLink = true }: { showShelfLink?: boolean }) {
  const { user, isGuest, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [modal, setModal] = useState<AuthMode | null>(null);
  const [preferencesOpen, setPreferencesOpen] = useState(false);

  return (
    <>
      {isGuest ? (
        <div className="auth-buttons">
          {showShelfLink && (
            <Link href="/dashboard" className="auth-header-button">
              My Stories
            </Link>
          )}
          <Link href="/characters" className="auth-header-button">
            My Characters
          </Link>
          <button type="button" onClick={() => setModal('login')} className="auth-header-button">
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setModal('signup')}
            className="auth-header-button signup"
          >
            Sign Up
          </button>
        </div>
      ) : (
        <div className="user-menu-container">
          <button
            type="button"
            className="user-menu-button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
          >
            {user?.email ?? 'Account'}
          </button>
          {menuOpen && (
            <div className="user-menu-dropdown" role="menu">
              {showShelfLink && (
                <Link href="/dashboard" className="user-menu-item" role="menuitem">
                  My Stories
                </Link>
              )}
              <Link href="/characters" className="user-menu-item" role="menuitem">
                My Characters
              </Link>
              <button
                type="button"
                role="menuitem"
                className="user-menu-item"
                onClick={() => {
                  setMenuOpen(false);
                  setPreferencesOpen(true);
                }}
              >
                Preferences
              </button>
              <button
                type="button"
                role="menuitem"
                className="user-menu-item"
                onClick={() => {
                  setMenuOpen(false);
                  void signOut();
                }}
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      )}

      {modal && <AuthModal mode={modal} onClose={() => setModal(null)} />}
      {preferencesOpen && (
        <PreferencesDialog mode="settings" onClose={() => setPreferencesOpen(false)} />
      )}
    </>
  );
}
