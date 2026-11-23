'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { usePreferences } from '@/hooks/usePreferences';
import PreferencesDialog from './PreferencesDialog';

/** Greets a new member once with their preferences and a nudge to create a character. */
export default function Onboarding() {
  const { user, isGuest, loading } = useAuth();
  const { preferences } = usePreferences();
  const pathname = usePathname();
  const [state, setState] = useState<'waiting' | 'open' | 'done'>('waiting');

  // Not while resetting a password or laying a story out for print.
  const quietPage = pathname.startsWith('/auth/') || pathname.endsWith('/print');
  const due = !loading && !!user && !isGuest && !preferences.onboarded && !quietPage;

  // Once open it stays open until closed: saving marks the member as welcomed,
  // and the dialog still has its second step to show.
  if (state === 'waiting' && due) setState('open');
  if (state !== 'open') return null;

  return <PreferencesDialog mode="welcome" onClose={() => setState('done')} />;
}
