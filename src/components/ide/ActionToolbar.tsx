"use client";

import { SaveIcon } from "../icons/SaveIcon";
import { PlayIcon } from "../icons/PlayIcon";
import { CheckCircleIcon } from "../icons/CheckCircleIcon";
import { MDS_TASKS } from "@/lib/mds-data";
import { extOf } from "@/lib/file-content";
import { useLanguage } from "@/lib/useLanguage";
import type { Task, TaskFormValues } from "@/lib/types";

interface ActionToolbarProps {
  activePath: string | null;
  isDirty: boolean;
  onSave: () => void;
  onOpenTask: (task: Task, initialValues?: Partial<TaskFormValues>) => void;
}

const TASK_IDS = {
  validate: "validate-dbc-file",
  run: "run-script-file",
  updateAutoscript: "update-autoscript",
  generateDbc: "generate-dbc-autoscript",
} as const;

function findTask(id: string): Task | undefined {
  return MDS_TASKS.find((t) => t.id === id);
}

function ToolIcon({ name }: { name: "upload" | "package" }) {
  const common = { width: 15, height: 15, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  if (name === "upload") return <svg {...common}><path d="M12 16V4M7 9l5-5 5 5" /><path d="M4 16.5V19a1.5 1.5 0 0 0 1.5 1.5h13A1.5 1.5 0 0 0 20 19v-2.5" /></svg>;
  return <svg {...common}><path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5v-9Z" /><path d="M3.7 7.7 12 12l8.3-4.3M12 12v9" /></svg>;
}

export function ActionToolbar({ activePath, isDirty, onSave, onOpenTask }: ActionToolbarProps) {
  const { t } = useLanguage();
  const ext = activePath ? extOf(activePath) : "";
  const isAutoscript = !!activePath && activePath.startsWith("autoscripts/");

  const validateTask = findTask(TASK_IDS.validate);
  const runTask = findTask(TASK_IDS.run);
  const updateTask = findTask(TASK_IDS.updateAutoscript);
  const generateTask = findTask(TASK_IDS.generateDbc);

  return (
    <div className="ide-toolbar" data-od-id="ide-action-toolbar">
      <button
        className="ide-toolbar-btn primary"
        disabled={!isDirty}
        onClick={onSave}
        title={t("ideToolbar.saveTitle")}
        data-od-id="ide-action-save"
      >
        <SaveIcon /> {t("ideToolbar.save")}
      </button>

      <span className="ide-toolbar-sep" />

      <button
        className="ide-toolbar-btn"
        disabled={!validateTask || ext !== "dbc"}
        onClick={() => validateTask && onOpenTask(validateTask, activePath ? { file: [activePath] } : undefined)}
        title={ext === "dbc" ? t("ideToolbar.validateTitleActive") : t("ideToolbar.validateTitleInactive")}
        data-od-id="ide-action-validate"
      >
        <CheckCircleIcon size={15} /> {t("ideToolbar.validate")}
      </button>

      <button
        className="ide-toolbar-btn"
        disabled={!runTask || (ext !== "dbc" && ext !== "sql")}
        onClick={() => runTask && onOpenTask(runTask, activePath ? { file: activePath } : undefined)}
        title={ext === "dbc" || ext === "sql" ? t("ideToolbar.runTitleActive") : t("ideToolbar.runTitleInactive")}
        data-od-id="ide-action-run"
      >
        <PlayIcon size={15} /> {t("ideToolbar.run")}
      </button>

      <button
        className="ide-toolbar-btn"
        disabled={!updateTask || !isAutoscript}
        onClick={() => updateTask && onOpenTask(updateTask)}
        title={isAutoscript ? t("ideToolbar.updateAutoscriptTitleActive") : t("ideToolbar.updateAutoscriptTitleInactive")}
        data-od-id="ide-action-update-autoscript"
      >
        <ToolIcon name="upload" /> {t("ideToolbar.updateAutoscript")}
      </button>

      <button
        className="ide-toolbar-btn"
        disabled={!generateTask}
        onClick={() => generateTask && onOpenTask(generateTask)}
        title={t("ideToolbar.generateDbcTitle")}
        data-od-id="ide-action-generate-dbc"
      >
        <ToolIcon name="package" /> {t("ideToolbar.generateDbc")}
      </button>
    </div>
  );
}
