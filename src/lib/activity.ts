"use client";

import { useMemo } from "react";
import { MDS_ACTIVITIES } from "./mockData";
import { activityLogStore } from "./activity-log";
import { usePersistedStore } from "./store";
import { useRunHistory } from "./useRunHistory";
import { useWorkspace } from "./workspace-context";
import type { ActivityEvent, RunRecord } from "./types";

export { logActivity } from "./activity-log";

/** How many rows the rail keeps on screen. Long enough to read as a feed,
 * short enough that it never becomes the page's own scroll problem. Newer
 * events push older ones off the bottom — a capped LIFO queue. */
const FEED_LIMIT = 20;

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

/** The rail's data: live runs, logged events and the seeded prototype history
 * for the active client, merged newest-first and capped. Run history is
 * stored flat (one list for the whole app), so it is narrowed to the client
 * by the client's own ticket ids — the relationship the hierarchy already
 * encodes, rather than a second copy of it on RunRecord.
 *
 * All three sources are shared stores or context, so a run pushed from the
 * task drawer, a ticket created on /tickets or a file deleted in the editor
 * shows up here on the same render — no navigation needed. */
export function useActivityFeed(): ActivityEvent[] {
  const { runs } = useRunHistory();
  const [logged] = usePersistedStore(activityLogStore);
  const { activeClient, tickets } = useWorkspace();

  return useMemo(() => {
    if (!activeClient) return [];
    const ticketIds = new Set(tickets.map((tk) => tk.id));
    const live = runs.filter((r) => ticketIds.has(r.ticket)).map((r) => runToActivity(r, activeClient.id));
    const own = logged.filter((a) => a.clientId === activeClient.id);
    const seeded = MDS_ACTIVITIES.filter((a) => a.clientId === activeClient.id);
    return [...live, ...own, ...seeded]
      .sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0))
      .slice(0, FEED_LIMIT);
  }, [runs, logged, activeClient, tickets]);
}
