"use client";

import { useMemo } from "react";
import { MDS_ACTIVITIES } from "./mockData";
import { useRunHistory } from "./useRunHistory";
import { useWorkspace } from "./workspace-context";
import type { ActivityEvent, RunRecord } from "./types";

/** How many rows the rail keeps. Long enough to feel like a feed, short enough
 * that it never becomes the page's own scroll problem. */
const FEED_LIMIT = 12;

function runToActivity(run: RunRecord, clientId: string): ActivityEvent {
  return {
    id: "run-" + run.id,
    clientId,
    kind: "run",
    status: run.status,
    taskId: run.taskId,
    action: run.taskLabel,
    target: run.outputPath || "—",
    ticket: run.ticket,
    user: run.user || "—",
    at: run.startedAt,
  };
}

/** The rail's data: everything the signed-in session actually ran, merged with
 * the seeded prototype history for the same client and sorted newest first.
 * Run history is stored flat (one list for the whole app), so it is narrowed to
 * the active client by the client's own ticket ids — the same relationship the
 * hierarchy already encodes, rather than a second copy of it on RunRecord. */
export function useActivityFeed(): ActivityEvent[] {
  const { runs } = useRunHistory();
  const { activeClient, tickets } = useWorkspace();

  return useMemo(() => {
    if (!activeClient) return [];
    const ticketIds = new Set(tickets.map((tk) => tk.id));
    const live = runs.filter((r) => ticketIds.has(r.ticket)).map((r) => runToActivity(r, activeClient.id));
    const seeded = MDS_ACTIVITIES.filter((a) => a.clientId === activeClient.id);
    return [...live, ...seeded]
      .sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0))
      .slice(0, FEED_LIMIT);
  }, [runs, activeClient, tickets]);
}
