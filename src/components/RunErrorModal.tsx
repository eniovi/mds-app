"use client";

import { ErrorLogBlock } from "./ErrorLogBlock";
import { formatDateTime } from "@/lib/format";
import { useLanguage } from "@/lib/useLanguage";
import { LOCALE_BY_LANGUAGE } from "@/lib/i18n";
import { runTaskLabel } from "@/lib/task-catalog-i18n";
import type { RunRecord } from "@/lib/types";

interface RunErrorModalProps {
  run: RunRecord;
  onClose: () => void;
}

/** "link para reabrir os logs detalhados de cada falha" from the Histórico
 * de Execuções tab — same ErrorLogBlock the live BatchRunDrawer report
 * uses, so a failure looks identical whether you're reading it right after
 * the run or reopening it from history days later. */
export function RunErrorModal({ run, onClose }: RunErrorModalProps) {
  const { t, language } = useLanguage();

  return (
    <div className="modal-backdrop" onClick={onClose} data-od-id="run-error-backdrop">
      <div className="modal modal-wide" onClick={(e) => e.stopPropagation()} data-od-id="run-error-modal">
        <div>
          <h3>{runTaskLabel(run.taskId, run.taskLabel, t)}</h3>
          <p className="text-sm text-muted">
            {t("runQueue.colTicket")} {run.ticket} · {formatDateTime(run.startedAt, LOCALE_BY_LANGUAGE[language])}{run.user ? ` · ${run.user}` : ""}
          </p>
        </div>
        {run.errorMessage ? (
          <ErrorLogBlock message={run.errorMessage} />
        ) : (
          <p className="text-sm text-muted">{t("runQueue.noErrorLog")}</p>
        )}
        <div className="modal-actions">
          <button className="btn btn-primary" onClick={onClose} data-od-id="run-error-close-button">{t("common.close")}</button>
        </div>
      </div>
    </div>
  );
}
