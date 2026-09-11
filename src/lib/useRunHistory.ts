"use client";

import { useCallback } from "react";
import { createPersistedStore, usePersistedStore } from "./store";
import type { RunRecord } from "./types";

const STORAGE_KEY = "mds_run_history";
const MAX_RECORDS = 50;

const runStore = createPersistedStore<RunRecord[]>(STORAGE_KEY, []);

export interface RunHistory {
  runs: RunRecord[];
  pushRun: (run: RunRecord, updateExisting?: boolean) => void;
}

/** Single source of truth for "mds_run_history". Backed by a shared store (see
 * lib/store.ts) so every consumer — the task drawer that pushes a run, the
 * file tree that lists its output, the activity rail that shows it — sees the
 * same list at the same moment. Newest first; capped at 50 by dropping the
 * oldest, which is what keeps the Histórico de Execuções tab a history rather
 * than an ever-growing log. */
export function useRunHistory(): RunHistory {
  const [runs, update] = usePersistedStore(runStore);

  const pushRun = useCallback(
    (run: RunRecord, updateExisting?: boolean) => {
      update((prev) => {
        const next = updateExisting ? prev.map((r) => (r.id === run.id ? run : r)) : [run, ...prev];
        return next.slice(0, MAX_RECORDS);
      });
    },
    [update],
  );

  return { runs, pushRun };
}
