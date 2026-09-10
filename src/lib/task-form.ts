import type { Task, TaskFormValues, FieldValue } from "./types";
import { fieldLabel, fieldValueLabel } from "./task-catalog-i18n";

type TFunc = (key: string, options?: Record<string, unknown>) => string;

export function defaultValues(task: Task): TaskFormValues {
  const v: TaskFormValues = {};
  task.fields.forEach((f) => {
    if (f.type === "yesno" || f.type === "select" || f.type === "tabs") v[f.id] = f.default || "";
    else if (f.multiple) v[f.id] = [];
    else v[f.id] = "";
  });
  return v;
}

/** Count from the task's first *required* multiple:true field — used to
 * append a live "(N)" to the primary action button, and to keep it disabled
 * at 0 without waiting for a failed submit attempt. Deliberately ignores
 * optional multi-select fields (e.g. generate-presentation-diff's "apps",
 * where 0 selected legitimately means "include all") — for those, showing
 * "(0)" or disabling the button would misreport what leaving it blank does.
 * Returns null when the task has no *required* multi-select field. */
export function primaryMultiFieldCount(task: Task, values: TaskFormValues): number | null {
  const field = task.fields.find((f) => f.multiple && f.required);
  if (!field) return null;
  const v = values[field.id];
  return Array.isArray(v) ? v.length : 0;
}

export function isTaskValid(task: Task, values: TaskFormValues): boolean {
  return task.fields.every((f) => {
    if (!f.required) return true;
    const v = values[f.id];
    return f.multiple ? Array.isArray(v) && v.length > 0 : !!v;
  });
}

function isEmptyValue(v: FieldValue | undefined): boolean {
  return v === undefined || v === "" || (Array.isArray(v) && v.length === 0);
}

export function asString(v: FieldValue | undefined): string | undefined {
  return typeof v === "string" ? v : undefined;
}

export function buildCommandPreview(task: Task, values: TaskFormValues): string {
  const parts = ["mds", "run", task.id];
  task.fields.forEach((f) => {
    if (f.type === "context-ticket") return;
    const v = values[f.id];
    if (isEmptyValue(v)) return;
    const rendered = Array.isArray(v) ? v.join(",") : v;
    parts.push(`--${f.id}="${rendered}"`);
  });
  return parts.join(" ");
}

/** Human-readable "(Field: value · Field: value)" tail for the execution
 * console. Takes `t` because it feeds a *translated* sentence
 * (taskDrawer.running): the raw catalog label and the stored machine value
 * would otherwise put Portuguese labels and tokens like "ALL"/"Yes" inside an
 * English or Spanish line. buildCommandPreview above stays raw on purpose —
 * that one is a literal CLI command, not prose. */
export function summarizeValues(task: Task, values: TaskFormValues, t: TFunc): string {
  return task.fields
    .filter((f) => f.type !== "context-ticket")
    .map((f) => {
      const v = values[f.id];
      if (isEmptyValue(v)) return null;
      const rendered = Array.isArray(v)
        ? v.map((item) => fieldValueLabel(task.id, f, item, t)).join(", ")
        : fieldValueLabel(task.id, f, v as string, t);
      return `${fieldLabel(task.id, f, t)}: ${rendered}`;
    })
    .filter(Boolean)
    .join(" · ");
}

const EXT_BY_DIR: Record<string, string> = {
  autoscripts: ".py",
  install: ".zip",
  documentation: ".docx",
  reports: ".rptdesign",
  presentations: ".mxs",
};

/** Resolves the real relative directory + filename a task's artifact lands in,
 * matching the MDS repo layout (see MDS_EXPECTED_DIRECTORIES). Returns undefined
 * for tasks that don't produce a new browsable file (apply/run/validate/sync). */
export function resolveOutputPath(task: Task, values: TaskFormValues, stamp: string): string | undefined {
  if (!task.outputDir) return undefined;

  let dir = task.outputDir;
  if (task.id === "extract-presentation") {
    const version = asString(values.xmlVersion) || "original";
    dir = `presentations/${version === "changes" ? "changes" : "original"}`;
  }

  const ext = EXT_BY_DIR[task.outputDir] || ".dbc";
  return `${dir}/${task.id}-${stamp}${ext}`;
}
