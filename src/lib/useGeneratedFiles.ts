"use client";

import { useMemo } from "react";
import { MDS_EXPECTED_DIRECTORIES } from "./mds-data";
import { useRunHistory } from "./useRunHistory";
import type { RunRecord } from "./types";
import type { TreeFileEntry } from "./file-tree";

export interface GeneratedFiles {
  runs: RunRecord[];
  filesByDir: Map<string, TreeFileEntry[]>;
  fileMeta: Map<string, TreeFileEntry>;
  allDirs: string[];
  allFiles: TreeFileEntry[];
  pushRun: (run: RunRecord, updateExisting?: boolean) => void;
}

/** Single source of truth for "which files exist in this ticket's workspace"
 * — derived from run history (useRunHistory), same data /files and
 * /run-queue both need. Keeping this in one hook means the two screens
 * can never quietly disagree about what's on disk. */
export function useGeneratedFiles(ticketId: string | undefined): GeneratedFiles {
  const { runs, pushRun } = useRunHistory();

  const filesByDir = useMemo(() => {
    const map = new Map<string, TreeFileEntry[]>();
    if (!ticketId) return map;
    runs
      .filter((r) => r.ticket === ticketId && r.status === "success" && r.outputPath)
      .forEach((r) => {
        const outputPath = r.outputPath as string;
        const idx = outputPath.lastIndexOf("/");
        const dir = idx === -1 ? "" : outputPath.slice(0, idx);
        const filename = idx === -1 ? outputPath : outputPath.slice(idx + 1);
        const entry: TreeFileEntry = { path: outputPath, filename, taskId: r.taskId, taskLabel: r.taskLabel, startedAt: r.startedAt };
        map.set(dir, [...(map.get(dir) || []), entry]);
      });
    return map;
  }, [runs, ticketId]);

  const fileMeta = useMemo(() => {
    const map = new Map<string, TreeFileEntry>();
    filesByDir.forEach((entries) => entries.forEach((e) => map.set(e.path, e)));
    return map;
  }, [filesByDir]);

  const allDirs = useMemo(() => {
    const extra = [...filesByDir.keys()].filter((d) => !MDS_EXPECTED_DIRECTORIES.includes(d));
    return [...MDS_EXPECTED_DIRECTORIES, ...extra];
  }, [filesByDir]);

  const allFiles = useMemo(() => [...fileMeta.values()], [fileMeta]);

  return { runs, filesByDir, fileMeta, allDirs, allFiles, pushRun };
}
