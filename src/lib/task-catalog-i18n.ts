import type { Category, SelectOption, Task, TaskField } from "./types";
import { MDS_TASKS } from "./mds-data";

type TFunc = (key: string, options?: Record<string, unknown>) => string;

/** Translation overlay for the task catalog. `mds-data.ts` stays the single
 * source of truth in Portuguese (the pt locale never duplicates it — pt.json
 * has no "catalog" namespace, so every lookup here falls back to the PT
 * string already on the object). en.json/es.json carry a "catalog" overlay
 * keyed by task/category/field id; missing keys silently fall back to the
 * PT default via i18next's `defaultValue`, so an untranslated addition to
 * mds-data.ts never renders a raw i18n key. */

export function categoryLabel(category: Pick<Category, "id" | "label">, t: TFunc): string {
  return t(`catalog.categories.${category.id}.label`, { defaultValue: category.label });
}

export function categoryHint(category: Pick<Category, "id" | "hint">, t: TFunc): string {
  return t(`catalog.categories.${category.id}.hint`, { defaultValue: category.hint });
}

export function taskLabel(task: Pick<Task, "id" | "label">, t: TFunc): string {
  return t(`catalog.tasks.${task.id}.label`, { defaultValue: task.label });
}

export function taskDetail(task: Pick<Task, "id" | "detail">, t: TFunc): string {
  return t(`catalog.tasks.${task.id}.detail`, { defaultValue: task.detail });
}

export function taskActionLabel(task: Pick<Task, "id" | "actionLabel">, t: TFunc): string | undefined {
  if (!task.actionLabel) return undefined;
  return t(`catalog.tasks.${task.id}.actionLabel`, { defaultValue: task.actionLabel });
}

export function fieldLabel(taskId: string, field: Pick<TaskField, "id" | "label">, t: TFunc): string {
  return t(`catalog.tasks.${taskId}.fields.${field.id}.label`, { defaultValue: field.label });
}

export function fieldHint(taskId: string, field: Pick<TaskField, "id" | "hint">, t: TFunc): string | undefined {
  if (!field.hint) return undefined;
  return t(`catalog.tasks.${taskId}.fields.${field.id}.hint`, { defaultValue: field.hint });
}

export function fieldPlaceholder(taskId: string, field: Pick<TaskField, "id" | "placeholder">, t: TFunc): string | undefined {
  if (!field.placeholder) return undefined;
  return t(`catalog.tasks.${taskId}.fields.${field.id}.placeholder`, { defaultValue: field.placeholder });
}

export function optionLabel(taskId: string, fieldId: string, option: SelectOption, t: TFunc): string {
  return t(`catalog.tasks.${taskId}.fields.${fieldId}.options.${option.value}`, { defaultValue: option.label });
}

/** Human form of a *stored* field value. select/tabs/yesno keep the machine
 * value ("ALL", "Yes") in TaskFormValues, so anything that shows a value back
 * to the user has to map it through the field's options first — otherwise the
 * raw token leaks into the UI. Mirrors YesNo.tsx's shared common.yes/common.no
 * handling; values with no matching option (free text, catalog picks) are
 * already human-readable and pass through untouched. */
export function fieldValueLabel(taskId: string, field: Pick<TaskField, "id" | "options">, value: string, t: TFunc): string {
  const option = field.options?.find((o) => o.value === value);
  if (!option) return value;
  if (value === "Yes") return t("common.yes");
  if (value === "No") return t("common.no");
  return optionLabel(taskId, field.id, option, t);
}

export function taskById(taskId: string): Task | undefined {
  return MDS_TASKS.find((task) => task.id === taskId);
}

/** Resolves a run's task name for display — looks the task up by id and
 * translates it live, so history entries relabel when the language changes
 * instead of staying frozen in whatever language they were run under.
 * Falls back to the stored snapshot if the task no longer exists in the
 * catalog. */
export function runTaskLabel(taskId: string, fallback: string, t: TFunc): string {
  const task = taskById(taskId);
  return task ? taskLabel(task, t) : fallback;
}
