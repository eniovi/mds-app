import type { EnvironmentKind } from "./types";

type TFunc = (key: string, options?: Record<string, unknown>) => string;

/** Shared kind → badge mapping, used by /environments and the ticket-level
 * environment tag/popover — one source of truth for what "PROD" etc. looks
 * like as a badge, so the two screens can never quietly drift apart. PROD/QA/DEV
 * are acronyms and stay verbatim in every language; only the "other" fallback
 * is real copy, so it reuses the same key the environment modal's kind select
 * already ships translated. */
export function environmentKindMeta(kind: EnvironmentKind, t: TFunc): { label: string; cls: string } {
  if (kind === "PROD") return { label: "PROD", cls: "badge-error" };
  if (kind === "QA") return { label: "QA", cls: "badge-warning" };
  if (kind === "DEV") return { label: "DEV", cls: "badge-neutral" };
  return { label: t("newEnvironmentModal.kindOther"), cls: "badge-neutral" };
}
