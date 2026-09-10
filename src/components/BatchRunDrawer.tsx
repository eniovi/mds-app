"use client";

import { useEffect, useRef, useState } from "react";
import { buildCommandPreview } from "@/lib/task-form";
import { shouldFail, mockErrorMessage } from "@/lib/mock-errors";
import { MDS_CONNECTION } from "@/lib/mockData";
import { RunStatusBadge } from "./RunStatusBadge";
import { ErrorLogBlock } from "./ErrorLogBlock";
import { useLanguage } from "@/lib/useLanguage";
import { taskLabel } from "@/lib/task-catalog-i18n";
import type { RunRecord, RunStatus, Task, TaskFormValues, Ticket } from "@/lib/types";
import type { TreeFileEntry } from "@/lib/file-tree";

interface LogLine {
  t: "dim" | "ok" | "err";
  m: string;
}

interface BatchResult {
  path: string;
  filename: string;
  status: RunStatus;
  errorMessage?: string;
}

interface BatchRunDrawerProps {
  items: TreeFileEntry[];
  task: Task;
  activeTicket: Ticket | null;
  pushRun: (run: RunRecord, updateExisting?: boolean) => void;
  onClose: () => void;
}

const VERBING_KEY: Record<string, string> = {
  "validate-dbc-file": "batchRunDrawer.verbValidating",
  "run-script-file": "batchRunDrawer.verbRunning",
};
const DONE_WORD_KEY: Record<string, string> = {
  "validate-dbc-file": "batchRunDrawer.doneValidated",
  "run-script-file": "batchRunDrawer.doneExecuted",
};

/** Generalized per-item sequential runner — reuses TaskDrawer's exact
 * drawer/console/result-card CSS. Originally built only for the run-queue
 * (always "run-script-file"); generalized to take any Task so the file
 * list's batch "Validar Selecionados"/"Executar Selecionados" actions get
 * the same per-item progress feedback instead of a second near-duplicate
 * drawer. Builds each item's command via the same buildCommandPreview used
 * everywhere else in the app, rather than a hand-typed string.
 *
 * Each item's outcome is deterministic (see lib/mock-errors.ts) — same file
 * always succeeds or always fails — so the "Relatório de Execução" shown at
 * the end (count + per-item badges + "Ver Logs de Erro") is reproducible
 * for demos instead of a coin flip on every run. Failed items never touch
 * filesByDir (validate/run tasks have no outputDir), so nothing is ever
 * removed from the workspace regardless of outcome — the queue screen's
 * "arquivos permanecem no workspace" notice is describing real behavior,
 * not just a promise. */
export function BatchRunDrawer({ items, task, activeTicket, pushRun, onClose }: BatchRunDrawerProps) {
  const { t } = useLanguage();
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [results, setResults] = useState<BatchResult[]>([]);
  const [finished, setFinished] = useState(false);
  const [expandedErrors, setExpandedErrors] = useState<Set<string>>(new Set());
  const consoleRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const field = task.fields[0];
  const verbing = t(VERBING_KEY[task.id] || "batchRunDrawer.verbExecuting");
  const doneWord = t(DONE_WORD_KEY[task.id] || "batchRunDrawer.doneCompleted");

  useEffect(() => {
    let cancelled = false;
    setLogs([{ t: "dim", m: `$ ${taskLabel(task, t)} — ${items.length} ${t("common.file", { count: items.length })}` }]);

    function runNext(i: number) {
      if (cancelled) return;
      if (i >= items.length) {
        setLogs((prev) => [...prev, { t: "ok", m: t("batchRunDrawer.batchDone") }]);
        setFinished(true);
        return;
      }
      const item = items[i];
      const runId = `run-${Date.now()}-${i}`;
      const ticketId = activeTicket ? activeTicket.id : "—";
      const values: TaskFormValues = field ? { [field.id]: field.multiple ? [item.path] : item.path } : {};

      pushRun({ id: runId, taskId: task.id, taskLabel: task.label, category: task.category, status: "running", startedAt: new Date().toISOString(), ticket: ticketId, fieldValues: values, user: MDS_CONNECTION.user });
      setLogs((prev) => [...prev, { t: "dim", m: `$ ${buildCommandPreview(task, values)}` }]);

      timerRef.current = setTimeout(() => {
        if (cancelled) return;
        const failed = shouldFail(item.path);
        const status: RunStatus = failed ? "error" : "success";
        const errorMessage = failed ? mockErrorMessage(item.path) : undefined;

        setLogs((prev) => [
          ...prev,
          failed
            ? { t: "err", m: t("batchRunDrawer.itemFailed", { filename: item.filename }) }
            : { t: "ok", m: t("batchRunDrawer.itemDone", { filename: item.filename, doneWord }) },
        ]);
        pushRun({ id: runId, taskId: task.id, taskLabel: task.label, category: task.category, status, startedAt: new Date().toISOString(), ticket: ticketId, fieldValues: values, user: MDS_CONNECTION.user, errorMessage }, true);
        setResults((prev) => [...prev, { path: item.path, filename: item.filename, status, errorMessage }]);
        runNext(i + 1);
      }, 650);
    }

    runNext(0);

    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs the fixed `items`/`task` snapshot the drawer was opened with; not meant to react to later prop changes
  }, []);

  useEffect(() => {
    if (consoleRef.current) consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
  }, [logs]);

  function toggleError(path: string) {
    setExpandedErrors((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }

  const successCount = results.filter((r) => r.status === "success").length;
  const errorCount = results.filter((r) => r.status === "error").length;

  return (
    <>
      <div className="backdrop" onClick={finished ? onClose : undefined} data-od-id="batch-run-backdrop" />
      <div className="drawer" data-od-id="batch-run-drawer">
        <div className="drawer-head">
          <div>
            <span className="cat-tag">{taskLabel(task, t)}</span>
            <h3>{finished ? t("batch.reportTitle") : `${verbing} ${items.length} ${t("common.file", { count: items.length })}`}</h3>
          </div>
          {finished && (
            <button className="drawer-close" onClick={onClose} aria-label={t("common.close")} data-od-id="batch-run-close-button">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
          )}
        </div>
        <div className="drawer-body scrollbar-thin">
          {!finished ? (
            <>
              <div className="console-wrap scrollbar-thin" ref={consoleRef} data-od-id="batch-run-console">
                {logs.map((l, idx) => (
                  <div key={idx} className={"console-line " + l.t}>{l.m}</div>
                ))}
              </div>
              <span className="badge badge-warning"><span className="badge-dot" />{verbing} {results.length}/{items.length}…</span>
            </>
          ) : (
            <div className="batch-report" data-od-id="batch-report">
              <div className="batch-report-summary">
                <span className="batch-report-count success">{t("batch.successCount", { count: successCount })}</span>
                <span className="batch-report-sep">|</span>
                <span className="batch-report-count error">{t("batch.errorCount", { count: errorCount })}</span>
              </div>
              <div className="batch-report-list">
                {results.map((r) => (
                  <div className="batch-report-item" key={r.path} data-od-id={"batch-report-item-" + r.path.replace(/\//g, "-")}>
                    <div className="batch-report-item-row">
                      <span className="file-picker-name">{r.filename}</span>
                      <RunStatusBadge status={r.status} />
                    </div>
                    {r.status === "error" && (
                      <>
                        <button
                          type="button"
                          className="batch-report-error-toggle"
                          onClick={() => toggleError(r.path)}
                          data-od-id={"batch-report-toggle-" + r.path.replace(/\//g, "-")}
                        >
                          {expandedErrors.has(r.path) ? t("batch.hideErrorLogs") : t("batch.viewErrorLogs")}
                        </button>
                        {expandedErrors.has(r.path) && r.errorMessage && <ErrorLogBlock message={r.errorMessage} />}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="drawer-foot">
          <button className="btn btn-primary" onClick={onClose} disabled={!finished} data-od-id="batch-run-finish-button">
            {finished ? t("common.finish") : `${verbing}…`}
          </button>
        </div>
      </div>
    </>
  );
}
