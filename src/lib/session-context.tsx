"use client";

import { createContext, useCallback, useContext, useMemo } from "react";
import { useRouter } from "next/navigation";
import { MDS_CONNECTION } from "./mockData";
import { removeKey } from "./storage";
import type { Connection } from "./types";

interface SessionContextValue {
  user: Connection;
  logout: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

/** Provides the authenticated user's identity + logout action to the whole
 * app tree (mounted once in the root layout). This is what lets
 * UserDropdownMenu render identically everywhere without each route
 * re-fetching or re-deriving who's logged in. */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const logout = useCallback(() => {
    removeKey("mds_auth");
    router.push("/login");
  }, [router]);

  const value = useMemo<SessionContextValue>(() => ({ user: MDS_CONNECTION, logout }), [logout]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within <SessionProvider>");
  return ctx;
}
