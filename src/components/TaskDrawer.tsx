"use client";

import { useEffect, useRef, useState } from "react";
import { FieldRow } from "./fields/FieldRow";
import { RunStatusBadge } from "./RunStatusBadge";
import { MDS_CATEGORIES } from "@/lib/mds-data";
import { MDS_CONNECTION } from "@/lib/mockData";
import { useEnvironments } from "@/lib/useEnvironments";
import { useLanguage } from "@/lib/useLanguage";
import { asString, buildCommandPreview, defaultValues, isTaskValid, primaryMultiFieldCount, resolveOutputPath, summarizeValues } from "@/lib/task-form";
import { categoryLabel, taskLabel, taskDetail, taskActionLabel } from "@/lib/task-catalog-i18n";
import type { RunRecord, RunStatus, Task, TaskFormValues, Ticket } from "@/lib/types";

interface LogLine {
  t: "dim" | "ok" | "err";
  m: string;
}

interface TaskDrawerProps {
  task: Task;
  onClose: () => void;
  activeTicket: Ticket | null;
  pushRun: (run: RunRecord, updateExisting?: boolean) => void;
  /** Pre-fills specific fields (e.g. the active file's path) without
   * touching the rest of the form's defaults — used when a task is opened
   * from a context that already knows part of the answer, like the IDE's
   * action toolbar opening "Validar Arquivo DBC" for the open file. */
  initialValues?: Partial<TaskFormValues>;
  /** Skip the form and start running the moment the drawer opens. For callers
   * that already know the complete answer, so the user isn't asked to pick
   * what they just pointed at — the IDE toolbar's "…Arquivo Corrente" buttons
   * act on the tab in front of you, not on a file chooser. Ignored (falls back
   * to the form) when the seeded values don't satisfy the task's required
   * fields, so this can never silently run something half-specified. */
  autoRun?: boolean;
}

export function TaskDrawer({ task, onClose, activeTicket, pushRun, initialValues, autoRun }: TaskDrawerProps) {
  const { t } = useLanguage();
  const seeded = { ...defaultValues(task), ...initialValues } as TaskFormValues;
  // decided before any state so the drawer can open *already* in the console
  // instead of painting the form for a frame and then replacing it
  const startsRunning = !!autoRun && isTaskValid(task, seeded);

  const [values, setValues] = useState<TaskFormValues>(seeded);
  const [touched, setTouched] = useState(false);
  const [showCmd, setShowCmd] = useState(false);
  const [mode, setMode] = useState<"form" | "console">(startsRunning ? "console" : "form");
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [runStatus, setRunStatus] = useState<RunStatus>("running");
  const [outputPath, setOutputPath] = useState("");
  const consoleRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const environments = useEnvironments();
  const activeEnv = activeTicket ? environments.find((e) => e.id === activeTicket.env) : undefined;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Stop any in-flight run when the drawer unmounts (e.g. "Concluir" clicked
  // before the run finished) so a stray interval can't keep pushing into a
  // gone component's closure or collide with a later run's state.
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function setField(id: string, val: TaskFormValues[string]) {
    setValues((prev) => {
      const next = { ...prev, [id]: val };
      task.fields.forEach((f) => {
        if (f.scopedBy === id) next[f.id] = f.multiple ? [] : "";
      });
      return next;
    });
  }

  const valid = isTaskValid(task, values);
  const multiCount = primaryMultiFieldCount(task, values);
  const actionLabel = (taskActionLabel(task, t) || t("taskDrawer.defaultAction")) + (multiCount !== null ? ` (${multiCount})` : "");

  function run() {
    setTouched(true);
    if (!valid) return;
    // Guard against a second run overlapping a still-ticking previous one
    // (e.g. "Voltar ao formulário" then "Executar" again before it finished).
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setMode("console");
    setRunStatus("running");
    setLogs([{ t: "dim", m: `$ ${buildCommandPreview(task, values)}` }]);

    const runId = "run-" + Date.now();
    pushRun({ id: runId, taskId: task.id, taskLabel: task.label, category: task.category, status: "running", startedAt: new Date().toISOString(), ticket: activeTicket ? activeTicket.id : "—", fieldValues: values, user: MDS_CONNECTION.user });

    const summary = summarizeValues(task, values, t);
    const steps: LogLine[] = [
      { t: "dim", m: t("taskDrawer.connecting") },
      { t: "dim", m: t("taskDrawer.authenticated", { host: activeEnv ? activeEnv.host : t("taskDrawer.unknownHost") }) },
      { t: "dim", m: t("taskDrawer.running", { summary: `${taskLabel(task, t)}${summary ? " (" + summary + ")" : ""}` }) },
    ];
    let i = 0;
    timerRef.current = setInterval(() => {
      if (i < steps.length) {
        setLogs((prev) => [...prev, steps[i]]);
        i++;
        return;
      }
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      const path = resolveOutputPath(task, values, stamp) || "";
      setOutputPath(path);
      setLogs((prev) => [...prev, { t: "ok", m: t("taskDrawer.completedOk") }]);
      setRunStatus("success");
      pushRun({ id: runId, taskId: task.id, taskLabel: task.label, category: task.category, status: "success", startedAt: new Date().toISOString(), ticket: activeTicket ? activeTicket.id : "—", outputPath: path || undefined, fieldValues: values, user: MDS_CONNECTION.user }, true);
    }, 650);
  }

  // Fires the auto-run once per mount. The latch is released in the cleanup so
  // it stays in step with the unmount effect below, which tears the interval
  // down: a remount (React strict mode does one in development, and a real one
  // would behave the same) then restarts the run instead of leaving it frozen
  // on "running" with its timer already cleared.
  const autoRunFired = useRef(false);
  useEffect(() => {
    if (!startsRunning || autoRunFired.current) return;
    autoRunFired.current = true;
    run();
    return () => {
      autoRunFired.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run() is recreated every render; the latch is what keeps this to one call per mount
  }, [startsRunning]);

  useEffect(() => {
    if (consoleRef.current) consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
  }, [logs]);

  const cat = MDS_CATEGORIES.find((c) => c.id === task.category);

  return (
    <>
      <div className="backdrop" onClick={onClose} data-od-id="drawer-backdrop" />
      <div className="drawer" data-od-id="task-drawer">
        <div className="drawer-head">
          <div>
            <span className="cat-tag">{cat ? categoryLabel(cat, t) : task.category}</span>
            <h3>{taskLabel(task, t)}</h3>
          </div>
          <button className="drawer-close" onClick={onClose} aria-label={t("common.close")} data-od-id="drawer-close-button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>

        {mode === "form" && (
          <>
            <div className="drawer-body scrollbar-thin">
              <p className="text-sm text-muted">{taskDetail(task, t)}</p>
              {task.fields.length === 0 && <div className="no-fields">{t("taskDrawer.noFields")}</div>}
              {task.fields.map((f) => (
                <FieldRow
                  key={f.id}
                  taskId={task.id}
                  field={f}
                  value={values[f.id]}
                  scopeValue={f.scopeConstant ?? (f.scopedBy ? asString(values[f.scopedBy]) : undefined)}
                  onChange={(v) => setField(f.id, v)}
                  touched={touched}
                  activeTicket={activeTicket}
                />
              ))}
              {task.fields.length > 0 && (
                <div>
                  <button className="cmd-toggle" onClick={() => setShowCmd((s) => !s)} data-od-id="toggle-command-preview">
                    {showCmd ? t("taskDrawer.hideCommand") : t("taskDrawer.showCommand")}
                  </button>
                  {showCmd && <div className="cmd-preview">{buildCommandPreview(task, values)}</div>}
                </div>
              )}
            </div>
            <div className="drawer-foot">
              <button className="btn btn-secondary" onClick={onClose}>{t("common.cancel")}</button>
              <button
                className="btn btn-primary"
                onClick={run}
                disabled={(touched && !valid) || multiCount === 0}
                data-od-id="execute-task-button"
              >
                {actionLabel}
              </button>
            </div>
          </>
        )}

        {mode === "console" && (
          <>
            <div className="drawer-body">
              <div className="console-wrap scrollbar-thin" ref={consoleRef} data-od-id="execution-console">
                {logs.filter(Boolean).map((l, idx) => (
                  <div key={idx} className={"console-line " + l.t}>{l.m}</div>
                ))}
              </div>
              {runStatus === "running" && <RunStatusBadge status="running" />}
              {runStatus === "success" && (
                <div className="result-card success" data-od-id="run-result-success">
                  <span className="badge badge-success"><span className="badge-dot" />{t("taskDrawer.resultSuccess")}</span>
                  {outputPath ? (
                    <>
                      <span className="text-sm">{t("taskDrawer.resultFile")}</span>
                      <span className="result-path">{outputPath}</span>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ width: "fit-content" }}
                        onClick={() => navigator.clipboard && navigator.clipboard.writeText(outputPath)}
                      >
                        {t("taskDrawer.copyPath")}
                      </button>
                    </>
                  ) : (
                    <span className="text-sm">{t("taskDrawer.noOutput")}</span>
                  )}
                </div>
              )}
            </div>
            <div className="drawer-foot">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
                  setMode("form");
                  setLogs([]);
                }}
              >
                {t("taskDrawer.backToForm")}
              </button>
              <button className="btn btn-primary" onClick={onClose}>{t("common.finish")}</button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
