'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { User } from '@supabase/supabase-js';
import { getSupabase } from '@/lib/supabase/browser';
import { isSupabaseConfigured } from '@/lib/env.client';
import { claimStories, prepareClaim } from '@/lib/api';

type Result = { error: string | null; needsEmailConfirmation?: boolean };

type AuthContextValue = {
  /** Always set once loading finishes, unless guest sessions are unavailable. */
  user: User | null;
  /** True for visitors who have not created an account; they still own their stories. */
  isGuest: boolean;
  loading: boolean;
  /** Set when the app cannot start a session at all (misconfiguration, guests disabled). */
  problem: string | null;
  /** Increases whenever guest stories are merged into an account, so lists can refresh. */
  claimVersion: number;
  signUp: (email: string, password: string) => Promise<Result>;
  signIn: (email: string, password: string) => Promise<Result>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<Result>;
  updatePassword: (password: string) => Promise<Result>;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const TICKET_KEY = 'dw.claimTicket';

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

const storage = {
  get: () => {
    try {
      return window.localStorage.getItem(TICKET_KEY);
    } catch {
      return null;
    }
  },
  set: (value: string | null) => {
    try {
      if (value) window.localStorage.setItem(TICKET_KEY, value);
      else window.localStorage.removeItem(TICKET_KEY);
    } catch {
      /* private mode: the stories simply stay with the guest session */
    }
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [problem, setProblem] = useState<string | null>(
    isSupabaseConfigured
      ? null
      : 'DreamWeaver is not configured yet. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, then redeploy.',
  );
  const [claimVersion, setClaimVersion] = useState(0);
  const startingGuest = useRef(false);

  const startGuestSession = useCallback(async () => {
    if (startingGuest.current) return;
    startingGuest.current = true;
    try {
      const { error } = await getSupabase().auth.signInAnonymously();
      if (error) {
        setProblem(
          'Guest sessions are switched off, so you need to sign in to write a story. (Site owner: enable "Allow anonymous sign-ins" in Supabase Auth settings.)',
        );
        setLoading(false);
      }
    } finally {
      startingGuest.current = false;
    }
  }, []);

  /** If this browser holds a ticket from an earlier guest session, cash it in. */
  const claimPending = useCallback(async () => {
    const ticket = storage.get();
    if (!ticket) return;
    try {
      const claimed = await claimStories(ticket);
      storage.set(null);
      if (claimed > 0) setClaimVersion((v) => v + 1);
    } catch (err) {
      console.warn('Could not claim guest stories yet:', err);
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const supabase = getSupabase();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Supabase warns against calling its API inside this callback, so defer.
      setTimeout(() => {
        if (session?.user) {
          setUser(session.user);
          setProblem(null);
          setLoading(false);
          if (!session.user.is_anonymous) void claimPending();
        } else if (event === 'INITIAL_SESSION' || event === 'SIGNED_OUT') {
          setUser(null);
          void startGuestSession();
        }
      }, 0);
    });

    return () => subscription.unsubscribe();
  }, [claimPending, startGuestSession]);

  /** Remember the guest's stories before the session is replaced by a real account. */
  const rememberGuestStories = useCallback(async () => {
    if (!user?.is_anonymous) return;
    try {
      const ticket = await prepareClaim();
      if (ticket) storage.set(ticket);
    } catch (err) {
      console.warn('Could not prepare guest stories for transfer:', err);
    }
  }, [user]);

  const signUp = useCallback(
    async (email: string, password: string): Promise<Result> => {
      await rememberGuestStories();
      const { data, error } = await getSupabase().auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) return { error: error.message };
      return { error: null, needsEmailConfirmation: !data.session };
    },
    [rememberGuestStories],
  );

  const signIn = useCallback(
    async (email: string, password: string): Promise<Result> => {
      await rememberGuestStories();
      const { error } = await getSupabase().auth.signInWithPassword({ email, password });
      return { error: error?.message ?? null };
    },
    [rememberGuestStories],
  );

  const signOut = useCallback(async () => {
    await getSupabase().auth.signOut();
  }, []);

  const sendPasswordReset = useCallback(async (email: string): Promise<Result> => {
    const { error } = await getSupabase().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset`,
    });
    return { error: error?.message ?? null };
  }, []);

  const updatePassword = useCallback(async (password: string): Promise<Result> => {
    const { error } = await getSupabase().auth.updateUser({ password });
    return { error: error?.message ?? null };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isGuest: !user || user.is_anonymous === true,
      loading,
      problem,
      claimVersion,
      signUp,
      signIn,
      signOut,
      sendPasswordReset,
      updatePassword,
    }),
    [
      user,
      loading,
      problem,
      claimVersion,
      signUp,
      signIn,
      signOut,
      sendPasswordReset,
      updatePassword,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
