"use client";

import { useCallback, useMemo } from "react";
import { MDS_EXPECTED_DIRECTORIES } from "./mds-data";
import { createPersistedStore, usePersistedStore } from "./store";
import { useRunHistory } from "./useRunHistory";
import { extOf, isTextFile } from "./file-content";
import type { RunRecord } from "./types";
import type { TreeFileEntry } from "./file-tree";

/** A file the user created by hand in the editor, as opposed to one a task
 * run produced. Its content lives in useFileEdits like any saved edit. */
interface UserFile {
  ticket: string;
  path: string;
  createdAt: string;
}

/** A generated file the user deleted. Run history is immutable (it is the
 * audit trail), so deleting one of its outputs is a tombstone, not an edit
 * to the run. User-created files are simply dropped from their own list. */
interface DeletedFile {
  ticket: string;
  path: string;
}

const userFileStore = createPersistedStore<UserFile[]>("mds_user_files", []);
const deletedFileStore = createPersistedStore<DeletedFile[]>("mds_deleted_files", []);

export interface WorkspaceFiles {
  runs: RunRecord[];
  filesByDir: Map<string, TreeFileEntry[]>;
  fileMeta: Map<string, TreeFileEntry>;
  allDirs: string[];
  allFiles: TreeFileEntry[];
  pushRun: (run: RunRecord, updateExisting?: boolean) => void;
  createFile: (path: string) => void;
  deleteFile: (path: string) => void;
}

export type FileNameError = "empty" | "invalidChars" | "noExtension" | "unsupportedExtension" | "exists";

/** What the inline "new file" input accepts. Rejects path separators and the
 * characters no file system takes, requires an extension, and only allows the
 * extensions the editor can actually open — a file it could not show would be
 * a dead row in the tree. */
export function validateFileName(name: string, dir: string, existing: Map<string, TreeFileEntry>): FileNameError | null {
  const trimmed = name.trim();
  if (!trimmed) return "empty";
  if (/[\\/:*?"<>|]/.test(trimmed) || trimmed.includes("..") || trimmed !== name.trim()) return "invalidChars";
  const ext = extOf(trimmed);
  if (!ext || trimmed.startsWith(".") || trimmed.endsWith(".")) return "noExtension";
  if (!isTextFile(trimmed)) return "unsupportedExtension";
  if (existing.has(dir ? `${dir}/${trimmed}` : trimmed)) return "exists";
  return null;
}

/** Single source of truth for "which files exist in this ticket's workspace":
 * everything a successful run produced, plus files created by hand in the
 * editor, minus anything deleted. /files, /run-queue and every file picker
 * read this, so no two screens can disagree about what is on disk. Backed by
 * shared stores, so a file created or deleted in the editor is visible to the
 * run queue on the same render. */
export function useWorkspaceFiles(ticketId: string | undefined): WorkspaceFiles {
  const { runs, pushRun } = useRunHistory();
  const [userFiles, updateUserFiles] = usePersistedStore(userFileStore);
  const [deleted, updateDeleted] = usePersistedStore(deletedFileStore);

  const filesByDir = useMemo(() => {
    const map = new Map<string, TreeFileEntry[]>();
    if (!ticketId) return map;
    const gone = new Set(deleted.filter((d) => d.ticket === ticketId).map((d) => d.path));
    const add = (entry: TreeFileEntry) => {
      const idx = entry.path.lastIndexOf("/");
      const dir = idx === -1 ? "" : entry.path.slice(0, idx);
      map.set(dir, [...(map.get(dir) || []), entry]);
    };

    runs
      .filter((r) => r.ticket === ticketId && r.status === "success" && r.outputPath && !gone.has(r.outputPath))
      .forEach((r) => {
        const outputPath = r.outputPath as string;
        const filename = outputPath.slice(outputPath.lastIndexOf("/") + 1);
        add({ path: outputPath, filename, taskId: r.taskId, taskLabel: r.taskLabel, startedAt: r.startedAt, origin: "run" });
      });

    userFiles
      .filter((f) => f.ticket === ticketId)
      .forEach((f) => {
        const filename = f.path.slice(f.path.lastIndexOf("/") + 1);
        add({ path: f.path, filename, taskId: "", taskLabel: "", startedAt: f.createdAt, origin: "manual" });
      });

    return map;
  }, [runs, userFiles, deleted, ticketId]);

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

  const createFile = useCallback(
    (path: string) => {
      if (!ticketId) return;
      updateUserFiles((prev) => [{ ticket: ticketId, path, createdAt: new Date().toISOString() }, ...prev]);
      // re-creating a name that was deleted earlier must bring it back
      updateDeleted((prev) => prev.filter((d) => !(d.ticket === ticketId && d.path === path)));
    },
    [ticketId, updateUserFiles, updateDeleted],
  );

  const deleteFile = useCallback(
    (path: string) => {
      if (!ticketId) return;
      const manual = userFiles.some((f) => f.ticket === ticketId && f.path === path);
      if (manual) updateUserFiles((prev) => prev.filter((f) => !(f.ticket === ticketId && f.path === path)));
      else updateDeleted((prev) => [{ ticket: ticketId, path }, ...prev]);
    },
    [ticketId, userFiles, updateUserFiles, updateDeleted],
  );

  return { runs, filesByDir, fileMeta, allDirs, allFiles, pushRun, createFile, deleteFile };
}
