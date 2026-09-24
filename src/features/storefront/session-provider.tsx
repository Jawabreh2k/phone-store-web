"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useCart } from "@/features/storefront/cart-provider";
import type { Locale } from "@/i18n/config";
import * as authApi from "@/lib/api/client";
import { ApiError, type UserProfile } from "@/lib/api/types";

export type SessionStatus = "loading" | "signedOut" | "signedIn";

interface SessionContextValue {
  profile: UserProfile | null;
  status: SessionStatus;
  signIn: (email: string, password: string, rememberMe: boolean) => Promise<UserProfile>;
  signUp: (fullName: string, email: string, password: string) => Promise<UserProfile>;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

/** Who's signed in, if anyone. Registering or signing in folds the guest cart into the account, so this refreshes the cart too. */
export function SessionProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  const { refresh: refreshCart } = useCart();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    authApi.getSession(locale).then(
      (next) => {
        if (!cancelled) {
          setProfile(next);
          setLoaded(true);
        }
      },
      () => {
        if (!cancelled) setLoaded(true);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [locale]);

  const applySignedIn = useCallback(
    async (next: UserProfile) => {
      setProfile(next);
      setLoaded(true);
      await refreshCart({ silent: true });
      return next;
    },
    [refreshCart],
  );

  const signIn = useCallback(
    (email: string, password: string, rememberMe: boolean) => authApi.signIn(locale, email, password, rememberMe).then(applySignedIn),
    [locale, applySignedIn],
  );

  const signUp = useCallback(
    (fullName: string, email: string, password: string) => authApi.signUp(locale, fullName, email, password).then(applySignedIn),
    [locale, applySignedIn],
  );

  const signOut = useCallback(async () => {
    try {
      await authApi.signOut(locale);
    } catch (error) {
      // The cookie was already gone. Clearing local state is the same outcome.
      if (!(error instanceof ApiError) || error.problem.status !== 401) throw error;
    }
    setProfile(null);
    await refreshCart({ silent: true });
  }, [locale, refreshCart]);

  const value = useMemo(
    () => ({
      profile,
      status: (!loaded ? "loading" : profile ? "signedIn" : "signedOut") as SessionStatus,
      signIn,
      signUp,
      signOut,
    }),
    [profile, loaded, signIn, signUp, signOut],
  );

  return <SessionContext value={value}>{children}</SessionContext>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
