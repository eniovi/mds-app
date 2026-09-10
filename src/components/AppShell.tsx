"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "./AppHeader";
import { RecentActivityRail } from "./RecentActivityRail";
import { useWorkspace } from "@/lib/workspace-context";

interface AppShellProps {
  children: React.ReactNode;
  search?: { query: string; setQuery: (q: string) => void };
  backLink?: { href: string; label: string };
  /** the client-selection screen itself sits above the hierarchy, so it renders
   * neither the context switchers nor the guard that sends you back to it */
  requireClient?: boolean;
  /** off for the file editor: .ide-page is a full-height, overflow-hidden
   * surface and a third column would starve the split pane. Every other screen
   * keeps the rail. */
  showActivityRail?: boolean;
  /** outer wrapper class, so the IDE can keep its .ide-page height contract */
  className?: string;
}

/** Frame shared by every screen below the client selection: global header,
 * then the recent-activity rail beside the page's own content.
 *
 * The guard is what makes the hierarchy real rather than decorative — land on
 * any inner route with no client chosen (fresh session, cleared storage, a
 * bookmarked deep link) and you are sent to /clients to pick one. It waits for
 * `hydrated` so it never fires on the server render's empty context. */
export function AppShell({
  children, search, backLink, requireClient = true, showActivityRail = true, className = "app-shell",
}: AppShellProps) {
  const { hydrated, activeClient } = useWorkspace();
  const router = useRouter();

  useEffect(() => {
    if (requireClient && hydrated && !activeClient) router.replace("/clients");
  }, [requireClient, hydrated, activeClient, router]);

  return (
    <div className={className}>
      <AppHeader search={search} backLink={backLink} />
      <div className="shell-body">
        {showActivityRail && <RecentActivityRail />}
        <div className="shell-content">{children}</div>
      </div>
    </div>
  );
}
