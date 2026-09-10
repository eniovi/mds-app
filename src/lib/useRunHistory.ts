"use client";

import { useEffect, useState } from "react";
import { readJSON, writeJSON } from "./storage";
import type { RunRecord } from "./types";

const STORAGE_KEY = "mds_run_history";
const MAX_RECORDS = 50;

export interface RunHistory {
  runs: RunRecord[];
  pushRun: (run: RunRecord, updateExisting?: boolean) => void;
}

/** Single source of truth for reading/writing "mds_run_history" — previously
 * duplicated between the home page's own state and useGeneratedFiles, which
 * could disagree if one trimmed differently than the other. Cap bumped from
 * 8 to 50: 8 was enough for a small "atividade recente" list, but the new
 * Histórico de Execuções tab needs enough real rows to be worth calling a
 * history. */
export function useRunHistory(): RunHistory {
  const [runs, setRuns] = useState<RunRecord[]>([]);

  useEffect(() => {
    setRuns(readJSON<RunRecord[]>(STORAGE_KEY, []));
  }, []);

  function pushRun(run: RunRecord, updateExisting?: boolean) {
    setRuns((prev) => {
      const next = updateExisting ? prev.map((r) => (r.id === run.id ? run : r)) : [run, ...prev];
      const trimmed = next.slice(0, MAX_RECORDS);
      writeJSON(STORAGE_KEY, trimmed);
      return trimmed;
    });
  }

  return { runs, pushRun };
}
