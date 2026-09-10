"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MDS_CONNECTION } from "./mockData";
import { readString, removeKey, writeString } from "./storage";
import type { Connection } from "./types";

export const AUTH_STORAGE_KEY = "mds_auth";
export const LOGIN_ROUTE = "/login";

/** "unknown" is the state before the effect has read localStorage — it exists
 * so the gate can hold the screen instead of flashing app content at someone
 * who turns out to be signed out. */
export type AuthState = "unknown" | "authenticated" | "anonymous";

interface SessionContextValue {
  user: Connection;
  auth: AuthState;
  signIn: () => void;
  logout: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

/** Provides the authenticated user's identity, the session's auth state and the
 * sign-in/logout actions to the whole app tree (mounted once in the root
 * layout). This is what lets UserDropdownMenu render identically everywhere
 * without each route re-fetching or re-deriving who's logged in, and it is the
 * single place that knows how the session is persisted — no screen writes the
 * auth key itself.
 *
 * SSR rule, as everywhere else in this app: localStorage is read in an effect,
 * never in a render-time initializer, so server and first client render agree.
 * SessionGate is what turns this state into a redirect. */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [auth, setAuth] = useState<AuthState>("unknown");

  useEffect(() => {
    setAuth(readString(AUTH_STORAGE_KEY) ? "authenticated" : "anonymous");
  }, []);

  const signIn = useCallback(() => {
    writeString(AUTH_STORAGE_KEY, "1");
    setAuth("authenticated");
  }, []);

  const logout = useCallback(() => {
    removeKey(AUTH_STORAGE_KEY);
    setAuth("anonymous");
    router.push(LOGIN_ROUTE);
  }, [router]);

  const value = useMemo<SessionContextValue>(
    () => ({ user: MDS_CONNECTION, auth, signIn, logout }),
    [auth, signIn, logout],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within <SessionProvider>");
  return ctx;
}
