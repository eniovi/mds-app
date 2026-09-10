"use client";

import { useLanguage } from "@/lib/useLanguage";
import { optionLabel } from "@/lib/task-catalog-i18n";
import type { TaskField } from "@/lib/types";

/** All yesno fields in the catalog share the same YES_NO option pair
 * (values are always literally "Yes"/"No"), so those two translate through
 * shared common.yes/common.no keys instead of duplicating "Sim"/"Não" under
 * every task+field combination. Any future field with its own custom yesno
 * options still resolves through the normal per-task optionLabel lookup. */
export function YesNo({ taskId, field, value, onChange }: { taskId: string; field: TaskField; value: string | undefined; onChange: (v: string) => void }) {
  const { t } = useLanguage();
  const opts = field.options || [];
  return (
    <div className="yesno">
      {opts.map((o) => (
        <button
          type="button"
          key={o.value}
          className={value === o.value ? "on" : ""}
          onClick={() => onChange(o.value)}
          data-od-id={"field-" + field.id + "-" + o.value}
        >
          {o.value === "Yes" ? t("common.yes") : o.value === "No" ? t("common.no") : optionLabel(taskId, field.id, o, t)}
        </button>
      ))}
    </div>
  );
}
