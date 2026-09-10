"use client";

import { RunStatusBadge } from "./RunStatusBadge";
import { formatDateTime } from "@/lib/format";
import { useLanguage } from "@/lib/useLanguage";
import { LOCALE_BY_LANGUAGE } from "@/lib/i18n";
import { runTaskLabel } from "@/lib/task-catalog-i18n";
import type { RunRecord } from "@/lib/types";

interface RunHistoryTableProps {
  runs: RunRecord[];
  onViewError: (run: RunRecord) => void;
}

/** Data/hora + ticket + usuário + status geral for every past execution —
 * a plain table rather than a timeline, matching every other list in this
 * app (tickets, environments, file pickers) instead of introducing a new
 * layout metaphor for just this one screen. */
export function RunHistoryTable({ runs, onViewError }: RunHistoryTableProps) {
  const { t, language } = useLanguage();

  if (runs.length === 0) {
    return (
      <div className="ds-empty-state" data-od-id="run-history-empty">
        <p className="ds-empty-state-title">{t("runQueue.noHistoryTitle")}</p>
        <p className="ds-empty-state-desc">{t("runQueue.noHistoryDesc")}</p>
      </div>
    );
  }

  return (
    <table className="data-table" data-od-id="run-history-table">
      <thead>
        <tr><th>{t("runQueue.colDateTime")}</th><th>{t("runQueue.colTask")}</th><th>{t("runQueue.colTicket")}</th><th>{t("runQueue.colUser")}</th><th>{t("runQueue.colStatus")}</th><th></th></tr>
      </thead>
      <tbody>
        {runs.map((r) => (
          <tr key={r.id} data-od-id={"run-history-row-" + r.id}>
            <td className="text-muted text-sm">{formatDateTime(r.startedAt, LOCALE_BY_LANGUAGE[language])}</td>
            <td>{runTaskLabel(r.taskId, r.taskLabel, t)}</td>
            <td className="text-muted">{r.ticket}</td>
            <td className="text-muted">{r.user || "—"}</td>
            <td><RunStatusBadge status={r.status} /></td>
            <td>
              {r.status === "error" && (
                <button className="btn btn-ghost btn-sm" onClick={() => onViewError(r)} data-od-id={"run-history-view-error-" + r.id}>
                  {t("runQueue.viewErrorLogs")}
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
