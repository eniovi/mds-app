"use client";

import { useLanguage } from "@/lib/useLanguage";
import { fieldLabel, optionLabel } from "@/lib/task-catalog-i18n";
import type { TaskField } from "@/lib/types";

/** Canonical DS tabs — none existed before this (the Manual da Marca
 * doesn't catalog a tabs component), so this establishes it: light
 * surface, var(--brand) underline for the active tab (decision/config
 * layer, per §8.2 — picking an artifact type is a configuration choice,
 * not an operational one, so this deliberately does not use the brand
 * teal). Horizontally scrollable so a 9-option strip never wraps awkwardly
 * inside a 480px drawer. */
export function TabsField({ taskId, field, value, onChange }: { taskId: string; field: TaskField; value: string; onChange: (value: string) => void }) {
  const { t } = useLanguage();
  const options = field.options || [];
  return (
    <div className="ds-tabs scrollbar-thin" role="tablist" aria-label={fieldLabel(taskId, field, t)} data-od-id={"field-" + field.id}>
      {options.map((o) => (
        <button
          type="button"
          key={o.value}
          role="tab"
          aria-selected={value === o.value}
          className={"ds-tab" + (value === o.value ? " active" : "")}
          onClick={() => onChange(o.value)}
          data-od-id={"field-" + field.id + "-tab-" + o.value}
        >
          {optionLabel(taskId, field.id, o, t)}
        </button>
      ))}
    </div>
  );
}
