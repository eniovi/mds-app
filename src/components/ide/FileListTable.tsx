"use client";

import { useMemo } from "react";
import { dirOf } from "@/lib/file-tree";
import { extOf, mockFileSize, formatFileSize } from "@/lib/file-content";
import { timeAgo } from "@/lib/format";
import { useLanguage } from "@/lib/useLanguage";
import type { TreeFileEntry } from "@/lib/file-tree";

interface FileListTableProps {
  allFiles: TreeFileEntry[];
  selected: Set<string>;
  onToggleFile: (path: string, checked: boolean) => void;
  onToggleAll: (paths: string[], checked: boolean) => void;
}

/** Flat, checkbox-selectable file list — the "fora do editor" counterpart
 * to FileTree, reusing FilePickerField's exact DataTable column layout
 * (Arquivo/Data de geração/Tamanho) so the two "pick some files" surfaces in
 * this app look identical. Scoped to .dbc/.sql because those are the only
 * extensions the batch Validar/Executar actions above this table can act
 * on — showing every file type here would let someone select files neither
 * button applies to. */
export function FileListTable({ allFiles, selected, onToggleFile, onToggleAll }: FileListTableProps) {
  const { t } = useLanguage();
  const files = useMemo(
    () => allFiles.filter((f) => ["dbc", "sql"].includes(extOf(f.path))).sort((a, b) => a.path.localeCompare(b.path)),
    [allFiles]
  );

  const allSelected = files.length > 0 && files.every((f) => selected.has(f.path));

  if (files.length === 0) {
    return (
      <div className="ds-empty-state" data-od-id="file-list-empty">
        <p className="ds-empty-state-title">{t("files.emptyListTitle")}</p>
        <p className="ds-empty-state-desc">{t("files.emptyListDesc")}</p>
      </div>
    );
  }

  return (
    <div className="file-list-table-wrap scrollbar-thin" data-od-id="file-list-table">
      <table className="data-table">
        <thead>
          <tr>
            <th className="file-picker-checkbox-cell">
              <input
                type="checkbox"
                className="ds-checkbox"
                checked={allSelected}
                onChange={(e) => onToggleAll(files.map((f) => f.path), e.target.checked)}
                aria-label={t("common.selectAll")}
              />
            </th>
            <th>{t("files.colFile")}</th>
            <th>{t("files.colGeneratedAt")}</th>
            <th>{t("files.colSize")}</th>
          </tr>
        </thead>
        <tbody>
          {files.map((f) => (
            <tr
              key={f.path}
              className={selected.has(f.path) ? "active-row" : ""}
              onClick={() => onToggleFile(f.path, !selected.has(f.path))}
              data-od-id={"file-list-row-" + f.path.replace(/\//g, "-")}
            >
              <td className="file-picker-checkbox-cell">
                <input
                  type="checkbox"
                  className="ds-checkbox"
                  checked={selected.has(f.path)}
                  onChange={(e) => onToggleFile(f.path, e.target.checked)}
                  onClick={(e) => e.stopPropagation()}
                  aria-label={f.filename}
                />
              </td>
              <td>
                <span className="file-picker-name">{f.filename}</span>
                <span className="file-picker-dir">{dirOf(f.path)}/</span>
              </td>
              <td className="text-muted text-sm">{timeAgo(f.startedAt, t)}</td>
              <td className="text-muted text-sm">{formatFileSize(mockFileSize(f.path))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
