"use client";

import { useState } from "react";
import { Trans } from "react-i18next";
import { AppShell } from "@/components/AppShell";
import { FileSourceList } from "@/components/queue/FileSourceList";
import { ExecutionQueue } from "@/components/queue/ExecutionQueue";
import { BatchRunDrawer } from "@/components/BatchRunDrawer";
import { RunHistoryTable } from "@/components/RunHistoryTable";
import { RunErrorModal } from "@/components/RunErrorModal";
import { InfoIcon } from "@/components/icons/InfoIcon";
import { useActiveTicket } from "@/lib/useActiveTicket";
import { useWorkspaceFiles } from "@/lib/useWorkspaceFiles";
import { MDS_TASKS } from "@/lib/mds-data";
import { useLanguage } from "@/lib/useLanguage";
import type { TreeFileEntry } from "@/lib/file-tree";
import type { RunRecord } from "@/lib/types";

const RUN_TASK = MDS_TASKS.find((t) => t.id === "run-script-file")!;

export default function RunQueuePage() {
  const activeTicket = useActiveTicket();
  const { runs, filesByDir, fileMeta, pushRun } = useWorkspaceFiles(activeTicket?.id);
  const { t } = useLanguage();

  const [viewMode, setViewMode] = useState<"queue" | "history">("queue");
  const [viewingErrorRun, setViewingErrorRun] = useState<RunRecord | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [queueItems, setQueueItems] = useState<TreeFileEntry[]>([]);
  const [showRunDrawer, setShowRunDrawer] = useState(false);

  function toggleFile(path: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(path);
      else next.delete(path);
      return next;
    });
    setQueueItems((prev) => {
      if (checked) {
        if (prev.some((i) => i.path === path)) return prev;
        const entry = fileMeta.get(path);
        return entry ? [...prev, entry] : prev;
      }
      return prev.filter((i) => i.path !== path);
    });
  }

  function toggleDir(paths: string[], checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      paths.forEach((p) => (checked ? next.add(p) : next.delete(p)));
      return next;
    });
    setQueueItems((prev) => {
      if (checked) {
        const toAdd = paths
          .filter((p) => !prev.some((i) => i.path === p))
          .map((p) => fileMeta.get(p))
          .filter((e): e is TreeFileEntry => !!e);
        return [...prev, ...toAdd];
      }
      return prev.filter((i) => !paths.includes(i.path));
    });
  }

  function finishRun() {
    setShowRunDrawer(false);
    setSelected(new Set());
    setQueueItems([]);
  }

  return (
    <AppShell backLink={{ href: "/files", label: t("runQueue.backToFiles") }}>

      <main className="tickets-main">
        <div className="page-head">
          <div>
            <h1 data-od-id="page-heading">{t("runQueue.heading")}</h1>
            <p>
              {activeTicket ? (
                <Trans i18nKey="runQueue.intro" values={{ ticket: activeTicket.id }} components={{ 1: <span className="ticket-id" /> }} />
              ) : (
                t("runQueue.loadingTicket")
              )}
            </p>
          </div>
        </div>

        <div className="ds-tabs" role="tablist" aria-label={t("runQueue.viewModeAria")} data-od-id="queue-view-mode-tabs">
          <button type="button" role="tab" aria-selected={viewMode === "queue"} className={"ds-tab" + (viewMode === "queue" ? " active" : "")} onClick={() => setViewMode("queue")} data-od-id="queue-view-mode-queue">
            {t("runQueue.tabQueue")}
          </button>
          <button type="button" role="tab" aria-selected={viewMode === "history"} className={"ds-tab" + (viewMode === "history" ? " active" : "")} onClick={() => setViewMode("history")} data-od-id="queue-view-mode-history">
            {t("runQueue.tabHistory")}
          </button>
        </div>

        {viewMode === "queue" ? (
          <>
            <div className="workspace-preserve-notice" data-od-id="workspace-preserve-notice">
              <InfoIcon size={14} />
              {t("runQueue.workspaceNotice")}
            </div>

            <div className="queue-columns">
              <div className="card queue-column" data-od-id="queue-source-column">
                <div className="queue-column-head">
                  <h3>{t("runQueue.generatedFiles")}</h3>
                  <span className="caption">{t("runQueue.selected", { count: selected.size })}</span>
                </div>
                <FileSourceList filesByDir={filesByDir} selected={selected} onToggleFile={toggleFile} onToggleDir={toggleDir} />
              </div>

              <div className="card queue-column" data-od-id="queue-order-column">
                <div className="queue-column-head">
                  <h3>{t("runQueue.executionSequence")}</h3>
                  <span className="caption">{t("runQueue.inQueue", { count: queueItems.length })}</span>
                </div>
                <ExecutionQueue items={queueItems} onChange={setQueueItems} onRemove={(path) => toggleFile(path, false)} />
                <div className="queue-action-bar">
                  <button
                    className="btn btn-primary"
                    disabled={queueItems.length === 0}
                    onClick={() => setShowRunDrawer(true)}
                    data-od-id="execute-queue-button"
                  >
                    {t("runQueue.executeButton", { count: queueItems.length })}
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="card" style={{ overflowX: "auto", marginTop: "var(--sp-24)" }} data-od-id="queue-history-card">
            <RunHistoryTable runs={runs} onViewError={setViewingErrorRun} />
          </div>
        )}
      </main>

      {showRunDrawer && (
        <BatchRunDrawer items={queueItems} task={RUN_TASK} activeTicket={activeTicket} pushRun={pushRun} onClose={finishRun} />
      )}

      {viewingErrorRun && <RunErrorModal run={viewingErrorRun} onClose={() => setViewingErrorRun(null)} />}
    </AppShell>
  );
}
