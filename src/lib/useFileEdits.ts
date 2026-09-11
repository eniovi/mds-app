"use client";

import { useCallback, useEffect, useState } from "react";
import { readJSON, writeJSON } from "./storage";

const STORAGE_KEY = "mds_file_edits";

type EditsMap = Record<string, string>;

/** Persists only *saved* file content, keyed by path — never on every
 * keystroke. The IDE page keeps the live (possibly unsaved) buffer in its
 * own state and compares it against getSaved(path) to know if a tab is
 * dirty. SSR-safe: starts empty, hydrates from localStorage after mount. */
export function useFileEdits() {
  const [edits, setEdits] = useState<EditsMap>({});

  useEffect(() => {
    setEdits(readJSON<EditsMap>(STORAGE_KEY, {}));
  }, []);

  const save = useCallback((path: string, content: string) => {
    setEdits((prev) => {
      const next = { ...prev, [path]: content };
      writeJSON(STORAGE_KEY, next);
      return next;
    });
  }, []);

  /** Drops a saved buffer — for a deleted file, so re-creating the same name
   * later starts empty instead of resurrecting the old content. */
  const forget = useCallback((path: string) => {
    setEdits((prev) => {
      if (!(path in prev)) return prev;
      const next = { ...prev };
      delete next[path];
      writeJSON(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const getSaved = useCallback((path: string): string | undefined => edits[path], [edits]);

  return { getSaved, save, forget };
}
