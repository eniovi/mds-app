"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useWorkspaceFiles } from "@/lib/useWorkspaceFiles";
import { dirOf } from "@/lib/file-tree";
import { mockFileSize, formatFileSize } from "@/lib/file-content";
import { timeAgo } from "@/lib/format";
import { useLanguage } from "@/lib/useLanguage";
import type { FieldValue, TaskField, Ticket } from "@/lib/types";

interface FilePickerFieldProps {
  field: TaskField;
  value: FieldValue | undefined;
  onChange: (value: FieldValue) => void;
  activeTicket: Ticket | null;
  invalid: boolean;
}

/** Replaces a manually-typed file path with a searchable DataTable of files
 * already generated in this ticket — same underlying source
 * (useWorkspaceFiles) and the same select-all pattern already established
 * for the run-queue's file list, reused here rather than rebuilt. */
export function FilePickerField({ field, value, onChange, activeTicket, invalid }: FilePickerFieldProps) {
  const { t } = useLanguage();
  const { allFiles } = useWorkspaceFiles(activeTicket?.id);
  const [query, setQuery] = useState("");
  const multiple = !!field.multiple;
  const selectedPaths = multiple ? (Array.isArray(value) ? value : []) : typeof value === "string" && value ? [value] : [];

  const poolFiles = useMemo(() => {
    if (!field.fileExtensions || field.fileExtensions.length === 0) return allFiles;
    return allFiles.filter((f) => field.fileExtensions!.some((ext) => f.filename.toLowerCase().endsWith("." + ext.toLowerCase())));
  }, [allFiles, field.fileExtensions]);

  const visibleFiles = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return poolFiles;
    return poolFiles.filter((f) => f.filename.toLowerCase().includes(q));
  }, [poolFiles, query]);

  function toggle(path: string, checked: boolean) {
    if (multiple) {
      onChange(checked ? [...selectedPaths, path] : selectedPaths.filter((p) => p !== path));
    } else {
      onChange(checked ? path : "");
    }
  }

  function toggleAll(checked: boolean) {
    if (!multiple) return;
    if (checked) {
      onChange([...new Set([...selectedPaths, ...visibleFiles.map((f) => f.path)])]);
    } else {
      const visibleSet = new Set(visibleFiles.map((f) => f.path));
      onChange(selectedPaths.filter((p) => !visibleSet.has(p)));
    }
  }

  const allVisibleSelected = visibleFiles.length > 0 && visibleFiles.every((f) => selectedPaths.includes(f.path));

  if (poolFiles.length === 0) {
    const kind = field.fileExtensions && field.fileExtensions.length > 0 ? `.${field.fileExtensions.join("/.")} ` : "";
    return (
      <div className="ds-empty-state" data-od-id={"field-" + field.id + "-empty"}>
        <p className="ds-empty-state-title">{t("fields.filePickerEmptyTitle", { kind })}</p>
        <p className="ds-empty-state-desc">{t("fields.filePickerEmptyDesc", { kind })}</p>
        <Link href="/" className="btn btn-secondary btn-sm">{t("fields.goToTaskPanel")}</Link>
      </div>
    );
  }

  return (
    <div className="file-picker" data-od-id={"field-" + field.id}>
      <input
        className="input"
        placeholder={t("fields.searchByName")}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        data-od-id={"field-" + field.id + "-search"}
      />
      <div className={"file-picker-table-wrap scrollbar-thin" + (invalid ? " invalid" : "")}>
        <table className="data-table">
          <thead>
            <tr>
              <th className="file-picker-checkbox-cell">
                {multiple && (
                  <input
                    type="checkbox"
                    className="ds-checkbox"
                    checked={allVisibleSelected}
                    onChange={(e) => toggleAll(e.target.checked)}
                    aria-label={t("common.selectAll")}
                  />
                )}
              </th>
              <th>{t("files.colFile")}</th>
              <th>{t("files.colGeneratedAt")}</th>
              <th>{t("files.colSize")}</th>
            </tr>
          </thead>
          <tbody>
            {visibleFiles.length === 0 ? (
              <tr><td colSpan={4} className="file-picker-no-results">{t("fields.noFileResults", { query })}</td></tr>
            ) : (
              visibleFiles.map((f) => (
                <tr
                  key={f.path}
                  className={selectedPaths.includes(f.path) ? "active-row" : ""}
                  onClick={() => toggle(f.path, !selectedPaths.includes(f.path))}
                  data-od-id={"field-" + field.id + "-row-" + f.path.replace(/\//g, "-")}
                >
                  <td className="file-picker-checkbox-cell">
                    <input
                      type="checkbox"
                      className="ds-checkbox"
                      checked={selectedPaths.includes(f.path)}
                      onChange={(e) => toggle(f.path, e.target.checked)}
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
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
