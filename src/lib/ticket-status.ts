import type { TicketStatus } from "./types";

type TFunc = (key: string, options?: Record<string, unknown>) => string;

/** Shared status → badge mapping for tickets, used by the tickets table and by
 * the header's ticket switcher — same reason environment-meta.ts exists: two
 * surfaces showing the same status must not drift apart. Uses only the
 * semantic status tokens (success/warning/destructive/neutral); the brand teal
 * is never a status colour, per the Manual da Marca §8.8. */
export function ticketStatusMeta(status: TicketStatus, t: TFunc): { label: string; cls: string } {
  if (status === "done") return { label: t("tickets.statusDone"), cls: "badge-success" };
  if (status === "in_progress") return { label: t("tickets.statusInProgress"), cls: "badge-warning" };
  if (status === "blocked") return { label: t("tickets.statusBlocked"), cls: "badge-error" };
  return { label: t("tickets.statusOpen"), cls: "badge-neutral" };
}
