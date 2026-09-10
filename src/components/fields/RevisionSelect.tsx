"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowIcon } from "../icons/ArrowIcon";
import { MDS_WORKFLOW_REVISIONS } from "@/lib/mds-data";
import { useLanguage } from "@/lib/useLanguage";
import type { RevisionStatus, TaskField } from "@/lib/types";

const STATUS_KEY: Record<RevisionStatus, { labelKey: string; cls: string }> = {
  active: { labelKey: "revision.active", cls: "badge-success" },
  enabled: { labelKey: "revision.enabled", cls: "badge-info" },
  inactive: { labelKey: "revision.inactive", cls: "badge-neutral" },
};

interface RevisionSelectProps {
  field: TaskField;
  value: string;
  scopeValue: string | undefined;
  onChange: (value: string) => void;
}

/** Cascading, badge-annotated revision picker for extract-workflow — native
 * <select> can't render colored badges inside <option>, so this is a custom
 * listbox styled to match the existing .combo-menu dropdown exactly. Stays
 * disabled (the same :disabled convention used everywhere else in the app)
 * until a process is chosen; TaskDrawer already clears this field's value
 * whenever "process" changes, via its generic scopedBy-reset logic. */
export function RevisionSelect({ field, value, scopeValue, onChange }: RevisionSelectProps) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const disabled = !scopeValue;
  const revisions = scopeValue ? MDS_WORKFLOW_REVISIONS[scopeValue] || [] : [];
  const selected = revisions.find((r) => r.number === value);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <div className="revision-select" ref={wrapRef}>
      <button
        type="button"
        className="revision-select-trigger"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        data-od-id={"field-" + field.id}
      >
        {disabled ? (
          <span className="text-muted">{t("revision.selectProcessFirst")}</span>
        ) : (
          <span className="revision-select-trigger-label">
            {selected ? (
              <>
                <span>{t("revision.revisionNumber", { number: selected.number })}</span>
                <span className={"badge " + STATUS_KEY[selected.status].cls}>
                  <span className="badge-dot" />
                  {t(STATUS_KEY[selected.status].labelKey)}
                </span>
              </>
            ) : (
              <span className="text-muted">{t("revision.latestDefault")}</span>
            )}
          </span>
        )}
        <ArrowIcon direction="down" size={14} />
      </button>

      {open && !disabled && (
        <div className="revision-select-menu" role="listbox">
          <button
            type="button"
            className={"revision-select-option" + (value === "" ? " selected" : "")}
            role="option"
            aria-selected={value === ""}
            onClick={() => { onChange(""); setOpen(false); }}
          >
            <span className="text-muted">{t("revision.latestDefault")}</span>
          </button>
          {revisions.map((r) => {
            const meta = STATUS_KEY[r.status];
            return (
              <button
                type="button"
                key={r.number}
                className={"revision-select-option" + (value === r.number ? " selected" : "")}
                role="option"
                aria-selected={value === r.number}
                onClick={() => { onChange(r.number); setOpen(false); }}
                data-od-id={"field-" + field.id + "-option-" + r.number}
              >
                <span>{t("revision.revisionNumber", { number: r.number })}</span>
                <span className={"badge " + meta.cls}>
                  <span className="badge-dot" />
                  {t(meta.labelKey)}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
