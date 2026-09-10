"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ContinuityMark } from "./icons/ContinuityMark";
import { LOGIN_ROUTE, useSession } from "@/lib/session-context";
import { useLanguage } from "@/lib/useLanguage";

/** Held while the session is still being read, and while an anonymous visitor
 * is being sent to the login. Deliberately almost empty — the point is that
 * nothing behind the login ever paints, not even for a frame. */
function SessionSplash() {
  const { t } = useLanguage();
  return (
    <div className="session-splash" role="status" aria-live="polite" data-od-id="session-splash">
      <ContinuityMark size={30} />
      <span className="visually-hidden">{t("common.loading")}</span>
    </div>
  );
}

/** The app's front door. Anyone who has not signed in lands on /login first,
 * whatever URL they typed — a fresh browser, cleared storage, a bookmarked
 * deep link into /files, or the tab left open after a logout.
 *
 * It wraps WorkspaceProvider rather than sitting beside it, so an anonymous
 * visitor never even hydrates a client, a ticket list or an activity feed.
 * /login itself is exempt, otherwise the gate would bounce the very screen it
 * redirects to. */
export function SessionGate({ children }: { children: React.ReactNode }) {
  const { auth } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const isLoginRoute = pathname === LOGIN_ROUTE;

  useEffect(() => {
    if (auth === "anonymous" && !isLoginRoute) router.replace(LOGIN_ROUTE);
  }, [auth, isLoginRoute, router]);

  // the login screen renders for everyone, signed in or not
  if (isLoginRoute) return <>{children}</>;

  // "unknown" = storage not read yet; "anonymous" = redirect already in flight
  if (auth !== "authenticated") return <SessionSplash />;

  return <>{children}</>;
}
