import { MDS_TASKS } from "./mds-data";
import type { RunRecord } from "./types";

/** Which app names have actually been extracted in this ticket, derived from
 * run history rather than assumed — scans every successful run whose task
 * has a catalog: "apps" field, and collects the app value(s) that run was
 * submitted with (captured in RunRecord.fieldValues by TaskDrawer). A
 * mock/static "all apps" list would be dishonest here; this only reports
 * apps a real (simulated) extraction actually touched. */
export function extractedApps(runs: RunRecord[], ticketId: string | undefined): Set<string> {
  const result = new Set<string>();
  if (!ticketId) return result;

  runs
    .filter((r) => r.ticket === ticketId && r.status === "success" && r.fieldValues)
    .forEach((r) => {
      const task = MDS_TASKS.find((t) => t.id === r.taskId);
      if (!task) return;
      task.fields
        .filter((f) => f.catalog === "apps")
        .forEach((f) => {
          const v = r.fieldValues![f.id];
          if (Array.isArray(v)) v.forEach((app) => app && result.add(app));
          else if (typeof v === "string" && v) result.add(v);
        });
    });

  return result;
}
