"use client";

import { IndeterminateCheckbox } from "./IndeterminateCheckbox";
import { timeAgo } from "@/lib/format";
import { useLanguage } from "@/lib/useLanguage";
import type { TreeFileEntry } from "@/lib/file-tree";

interface FileSourceListProps {
  filesByDir: Map<string, TreeFileEntry[]>;
  selected: Set<string>;
  onToggleFile: (path: string, checked: boolean) => void;
  onToggleDir: (paths: string[], checked: boolean) => void;
}

export function FileSourceList({ filesByDir, selected, onToggleFile, onToggleDir }: FileSourceListProps) {
  const { t } = useLanguage();
  const dirsWithFiles = [...filesByDir.entries()].filter(([, files]) => files.length > 0);

  if (dirsWithFiles.length === 0) {
    return <p className="queue-empty" data-od-id="queue-source-empty">{t("queue.sourceEmpty")}</p>;
  }

  return (
    <div className="queue-source-list scrollbar-thin" data-od-id="queue-source-list">
      {dirsWithFiles.map(([dir, files]) => {
        const selectedCount = files.filter((f) => selected.has(f.path)).length;
        const allSelected = selectedCount === files.length;
        const someSelected = selectedCount > 0 && !allSelected;
        return (
          <div className="queue-source-group" key={dir} data-od-id={"queue-source-dir-" + dir.replace(/\//g, "-")}>
            <label className="queue-source-dir-row">
              <IndeterminateCheckbox
                checked={allSelected}
                indeterminate={someSelected}
                onChange={(checked) => onToggleDir(files.map((f) => f.path), checked)}
              />
              <span className="queue-source-dir-name">{dir}/</span>
              <span className="caption">{selectedCount}/{files.length}</span>
            </label>
            <div className="queue-source-files">
              {files.map((f) => (
                <label className="queue-source-file-row" key={f.path} data-od-id={"queue-source-file-" + f.path.replace(/\//g, "-")}>
                  <IndeterminateCheckbox checked={selected.has(f.path)} onChange={(checked) => onToggleFile(f.path, checked)} />
                  <span className="queue-source-file-name">{f.filename}</span>
                  <span className="text-muted text-sm">{timeAgo(f.startedAt, t)}</span>
                </label>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
