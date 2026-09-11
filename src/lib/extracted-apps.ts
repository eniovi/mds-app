import { MDS_TASKS } from "./mds-data";
import type { RunRecord } from "./types";

/** Which app names have artifacts of a *specific kind* in this ticket, derived
 * from run history rather than assumed: only successful runs of `byTaskId`
 * count, and the app value(s) that run was submitted with (captured in
 * RunRecord.fieldValues by TaskDrawer) are what gets collected.
 *
 * In this prototype the run history *is* the local directory — every
 * successful run is a file under the task's outputDir — so "apps that have a
 * screen extraction on disk" is exactly "apps a successful extract-presentation
 * run was submitted with". A static "all apps" list would be dishonest here,
 * and so would counting any extraction: an app whose menus were extracted has
 * nothing to diff a screen against. */
export function extractedApps(runs: RunRecord[], ticketId: string | undefined, byTaskId: string): Set<string> {
  const result = new Set<string>();
  if (!ticketId) return result;
  const task = MDS_TASKS.find((t) => t.id === byTaskId);
  if (!task) return result;
  const appFields = task.fields.filter((f) => f.catalog === "apps");

  runs
    .filter((r) => r.ticket === ticketId && r.taskId === byTaskId && r.status === "success" && r.fieldValues)
    .forEach((r) => {
      appFields.forEach((f) => {
        const v = r.fieldValues![f.id];
        if (Array.isArray(v)) v.forEach((app) => app && result.add(app));
        else if (typeof v === "string" && v) result.add(v);
      });
    });

  return result;
}
