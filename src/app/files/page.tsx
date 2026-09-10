"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Trans } from "react-i18next";
import { AppShell } from "@/components/AppShell";
import { FileTree } from "@/components/ide/FileTree";
import { SplitPane } from "@/components/ide/SplitPane";
import { EditorTabs } from "@/components/ide/EditorTabs";
import { CodeEditorPane } from "@/components/ide/CodeEditorPane";
import { ActionToolbar } from "@/components/ide/ActionToolbar";
import { FileListTable } from "@/components/ide/FileListTable";
import { BatchActionBar } from "@/components/BatchActionBar";
import { BatchRunDrawer } from "@/components/BatchRunDrawer";
import { TaskDrawer } from "@/components/TaskDrawer";
import { useActiveTicket } from "@/lib/useActiveTicket";
import { useGeneratedFiles } from "@/lib/useGeneratedFiles";
import { useFileEdits } from "@/lib/useFileEdits";
import { generateMockContent, extOf } from "@/lib/file-content";
import { buildFileTree, pathsWithFiles } from "@/lib/file-tree";
import { MDS_TASKS } from "@/lib/mds-data";
import { useLanguage } from "@/lib/useLanguage";
import type { TreeFileEntry } from "@/lib/file-tree";
import type { Task, TaskFormValues } from "@/lib/types";

const VALIDATE_TASK = MDS_TASKS.find((t) => t.id === "validate-dbc-file")!;
const RUN_TASK = MDS_TASKS.find((t) => t.id === "run-script-file")!;

export default function FilesPage() {
  const activeTicket = useActiveTicket();
  const { filesByDir, fileMeta, allDirs, allFiles, pushRun } = useGeneratedFiles(activeTicket?.id);
  const { getSaved, save } = useFileEdits();
  const { t } = useLanguage();

  const tree = useMemo(() => buildFileTree(allDirs, filesByDir), [allDirs, filesByDir]);
  const defaultExpanded = useMemo(() => pathsWithFiles(tree), [tree]);

  const [openTabs, setOpenTabs] = useState<string[]>([]);
  const [activePath, setActivePath] = useState<string | null>(null);
  const [buffers, setBuffers] = useState<Record<string, string>>({});

  function originalContentFor(path: string): string {
    const saved = getSaved(path);
    if (saved !== undefined) return saved;
    const meta = fileMeta.get(path);
    return meta ? generateMockContent(path, { taskLabel: meta.taskLabel, ticketId: activeTicket?.id, generatedAt: meta.startedAt }) : "";
  }

  const openFile = useCallback(
    (file: TreeFileEntry) => {
      setOpenTabs((prev) => (prev.includes(file.path) ? prev : [...prev, file.path]));
      setActivePath(file.path);
      setBuffers((prev) => {
        if (prev[file.path] !== undefined) return prev;
        const saved = getSaved(file.path);
        const content = saved !== undefined ? saved : generateMockContent(file.path, { taskLabel: file.taskLabel, ticketId: activeTicket?.id, generatedAt: file.startedAt });
        return { ...prev, [file.path]: content };
      });
    },
    [getSaved, activeTicket]
  );

  const closeTab = useCallback((path: string) => {
    setOpenTabs((prev) => {
      const idx = prev.indexOf(path);
      const next = prev.filter((p) => p !== path);
      setActivePath((current) => (current !== path ? current : next[idx] ?? next[idx - 1] ?? null));
      return next;
    });
  }, []);

  const dirtyPaths = useMemo(() => {
    const set = new Set<string>();
    openTabs.forEach((path) => {
      if (buffers[path] !== undefined && buffers[path] !== originalContentFor(path)) set.add(path);
    });
    return set;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- originalContentFor closes over getSaved/fileMeta/activeTicket, already in deps below
  }, [openTabs, buffers, getSaved, fileMeta, activeTicket]);

  function handleContentChange(value: string) {
    if (!activePath) return;
    setBuffers((prev) => ({ ...prev, [activePath]: value }));
  }

  // Refs so the single global Ctrl+S listener always reads the latest
  // active path/buffer without needing to re-attach on every keystroke.
  const activePathRef = useRef(activePath);
  const buffersRef = useRef(buffers);
  useEffect(() => { activePathRef.current = activePath; }, [activePath]);
  useEffect(() => { buffersRef.current = buffers; }, [buffers]);

  const saveActive = useCallback(() => {
    const path = activePathRef.current;
    if (path && buffersRef.current[path] !== undefined) save(path, buffersRef.current[path]);
  }, [save]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        saveActive();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [saveActive]);

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskInitialValues, setTaskInitialValues] = useState<Partial<TaskFormValues> | undefined>(undefined);

  function openTask(task: Task, initialValues?: Partial<TaskFormValues>) {
    setSelectedTask(task);
    setTaskInitialValues(initialValues);
  }

  const [viewMode, setViewMode] = useState<"editor" | "list">("editor");
  const [batchSelected, setBatchSelected] = useState<Set<string>>(new Set());
  const [batchTask, setBatchTask] = useState<Task | null>(null);

  function toggleBatchFile(path: string, checked: boolean) {
    setBatchSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(path);
      else next.delete(path);
      return next;
    });
  }

  function toggleBatchAll(paths: string[], checked: boolean) {
    setBatchSelected((prev) => {
      const next = new Set(prev);
      paths.forEach((p) => (checked ? next.add(p) : next.delete(p)));
      return next;
    });
  }

  const batchItems = [...batchSelected].map((p) => fileMeta.get(p)).filter((e): e is TreeFileEntry => !!e);
  // "Validar" only ever acts on the .dbc subset of what's checked — a
  // selected .sql row still counts toward "Executar" but is silently
  // excluded here rather than failing the batch.
  const activeBatchItems = batchTask?.id === VALIDATE_TASK.id ? batchItems.filter((f) => extOf(f.path) === "dbc") : batchItems;

  function closeBatchDrawer() {
    setBatchTask(null);
    setBatchSelected(new Set());
  }

  return (
    <AppShell
      className="ide-page"
      showActivityRail={false}
      backLink={{ href: "/", label: t("files.backToPanel") }}
    >

      <div className="ide-page-head page-head">
        <div>
          <h1 data-od-id="page-heading">{t("files.heading")}</h1>
          <p>
            {activeTicket ? (
              viewMode === "editor" ? (
                <Trans i18nKey="files.introEditor" values={{ ticket: activeTicket.id }} components={{ 1: <span className="ticket-id" /> }} />
              ) : (
                <Trans i18nKey="files.introList" values={{ ticket: activeTicket.id }} components={{ 1: <span className="ticket-id" /> }} />
              )
            ) : (
              t("files.loadingTicket")
            )}
          </p>
        </div>
        <div style={{ display: "flex", gap: "var(--sp-12)" }}>
          <Link className="btn btn-secondary" href="/run-queue" data-od-id="open-run-queue-link">{t("files.runQueueLink")}</Link>
          <Link className="btn btn-secondary" href="/tickets" data-od-id="switch-ticket-link">{t("files.switchTicket")}</Link>
        </div>
      </div>

      <div className="ds-tabs" role="tablist" aria-label={t("files.viewModeAria")} data-od-id="files-view-mode-tabs">
        <button type="button" role="tab" aria-selected={viewMode === "editor"} className={"ds-tab" + (viewMode === "editor" ? " active" : "")} onClick={() => setViewMode("editor")} data-od-id="files-view-mode-editor">
          {t("files.tabEditor")}
        </button>
        <button type="button" role="tab" aria-selected={viewMode === "list"} className={"ds-tab" + (viewMode === "list" ? " active" : "")} onClick={() => setViewMode("list")} data-od-id="files-view-mode-list">
          {t("files.tabList")}
        </button>
      </div>

      {viewMode === "editor" ? (
        <div className="ide-workspace" data-od-id="ide-workspace">
          <SplitPane
            left={
              <FileTree
                nodes={tree}
                activePath={activePath}
                dirtyPaths={dirtyPaths}
                defaultExpanded={defaultExpanded}
                onOpenFile={openFile}
              />
            }
            right={
              <div className="ide-editor-col">
                <ActionToolbar
                  activePath={activePath}
                  isDirty={!!activePath && dirtyPaths.has(activePath)}
                  onSave={saveActive}
                  onOpenTask={openTask}
                />
                <EditorTabs paths={openTabs} activePath={activePath} dirtyPaths={dirtyPaths} onSelect={setActivePath} onClose={closeTab} />
                <div className="ide-editor-body">
                  <CodeEditorPane path={activePath} content={activePath ? buffers[activePath] ?? "" : ""} onChange={handleContentChange} />
                </div>
              </div>
            }
          />
        </div>
      ) : (
        <div className="card file-list-view" data-od-id="file-list-view">
          <BatchActionBar
            selectedPaths={[...batchSelected]}
            onValidate={() => setBatchTask(VALIDATE_TASK)}
            onRun={() => setBatchTask(RUN_TASK)}
          />
          <FileListTable allFiles={allFiles} selected={batchSelected} onToggleFile={toggleBatchFile} onToggleAll={toggleBatchAll} />
        </div>
      )}

      {selectedTask && (
        <TaskDrawer
          task={selectedTask}
          onClose={() => { setSelectedTask(null); setTaskInitialValues(undefined); }}
          activeTicket={activeTicket}
          pushRun={pushRun}
          initialValues={taskInitialValues}
        />
      )}

      {batchTask && (
        <BatchRunDrawer items={activeBatchItems} task={batchTask} activeTicket={activeTicket} pushRun={pushRun} onClose={closeBatchDrawer} />
      )}
    </AppShell>
  );
}
