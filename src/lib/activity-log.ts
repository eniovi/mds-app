"use client";

import { MDS_CONNECTION } from "./mockData";
import { createPersistedStore } from "./store";
import type { ActivityEvent, ActivityKind, RunStatus } from "./types";

/** Cap for the persisted log of non-run events. Anything past the rail's own
 * limit can never be shown again, so keeping more would only grow storage. */
const LOG_LIMIT = 40;

const STORAGE_KEY = "mds_activity_log";

/** Shared store of events the app itself logs (as opposed to task runs, which
 * live in run history). Kept in its own module — separate from the feed hook
 * in activity.ts — so workspace-context can emit events without importing the
 * hook that imports workspace-context. */
export const activityLogStore = createPersistedStore<ActivityEvent[]>(STORAGE_KEY, []);

export interface LogInput {
  clientId: string;
  kind: ActivityKind;
  status?: RunStatus;
  /** i18n key under activity.actions.* — the rail translates it live */
  actionKey: string;
  target: string;
  ticket: string;
}

/** Records an event that is *not* a task run — a ticket created, an
 * environment saved or tested, a file created or deleted — so the rail
 * reflects everything the user does, not only what the task drawer runs.
 * Runs never come through here: they are projected straight from run
 * history, which already is their source of truth. Callable from anywhere
 * (event handlers, context actions); it is not a hook. */
export function logActivity(input: LogInput): void {
  const event: ActivityEvent = {
    id: "act-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
    clientId: input.clientId,
    kind: input.kind,
    status: input.status ?? "success",
    action: input.actionKey,
    actionKey: input.actionKey,
    target: input.target,
    ticket: input.ticket,
    user: MDS_CONNECTION.user,
    at: new Date().toISOString(),
  };
  activityLogStore.set((prev) => [event, ...prev].slice(0, LOG_LIMIT));
}
