"use client";

import { useEffect, useRef, useState } from "react";
import { mdsCatalogFor } from "@/lib/mds-data";
import { useGeneratedFiles } from "@/lib/useGeneratedFiles";
import { extractedApps } from "@/lib/extracted-apps";
import { useLanguage } from "@/lib/useLanguage";
import type { FieldValue, TaskField, Ticket } from "@/lib/types";

interface ComboboxProps {
  field: TaskField;
  value: FieldValue | undefined;
  scopeValue: string | undefined;
  onChange: (value: FieldValue) => void;
  invalid: boolean;
  activeTicket: Ticket | null;
}

export function Combobox({ field, value, scopeValue, onChange, invalid, activeTicket }: ComboboxProps) {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const { runs } = useGeneratedFiles(activeTicket?.id);

  const baseOptions = field.catalog ? mdsCatalogFor(field.catalog, scopeValue) : [];
  const detected = field.extractedBy ? extractedApps(runs, activeTicket?.id, field.extractedBy) : null;
  const options = detected ? baseOptions.filter((o) => detected.has(o)) : baseOptions;

  const multiple = !!field.multiple;
  const singleValue = typeof value === "string" ? value : "";
  const arrayValue = Array.isArray(value) ? value : [];
  const selected = multiple ? arrayValue : singleValue ? [singleValue] : [];

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  if (field.scopedBy && !scopeValue) {
    return <div className="combo-disabled">{t("fields.selectFieldFirst", { field: field.scopedBy })}</div>;
  }

  // Strict filter with nothing behind it: there is no app to pick, so an
  // input would be a dead end. The DS empty state says what is missing and
  // what to do about it (run the screen extraction first) instead. The
  // wording is screen-specific because generate-presentation-diff is the only
  // field using `extractedBy` today; a second one gets its own keys.
  if (field.extractedBy && options.length === 0) {
    return (
      <div className="ds-empty-state combo-empty-state" role="status" data-od-id={"field-" + field.id + "-empty"}>
        <p className="ds-empty-state-title">{t("fields.noScreenExtractionTitle")}</p>
        <p className="ds-empty-state-desc">{t("fields.noScreenExtractionDesc")}</p>
      </div>
    );
  }

  const filtered = options.filter((o) => o.toLowerCase().includes(query.toLowerCase()) && !selected.includes(o));

  function pick(opt: string) {
    if (multiple) {
      onChange([...arrayValue, opt]);
      setQuery("");
    } else {
      onChange(opt);
      setQuery(opt);
      setOpen(false);
    }
  }
  function removeChip(opt: string) {
    if (multiple) onChange(arrayValue.filter((v) => v !== opt));
    else {
      onChange("");
      setQuery("");
    }
  }

  return (
    <div className="combo" ref={wrapRef}>
      {field.extractedBy && (
        <div className="combo-badge-row">
          <span className="badge badge-success" data-od-id={"field-" + field.id + "-detected-badge"}>
            <span className="badge-dot" />
            {t("fields.screensDetected", { count: options.length })}
          </span>
        </div>
      )}
      {multiple && selected.length > 0 && (
        <div className="chips">
          {selected.map((s) => (
            <span className="chip" key={s}>
              {s}
              <button type="button" onClick={() => removeChip(s)} aria-label={t("fields.removeChipAria", { value: s })}>×</button>
            </span>
          ))}
        </div>
      )}
      <input
        className={"input" + (invalid ? " invalid" : "")}
        placeholder={multiple ? t("fields.searchAndAdd") : t("fields.search")}
        value={multiple ? query : singleValue || query}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          if (!multiple) onChange("");
          setOpen(true);
        }}
        data-od-id={"field-" + field.id}
      />
      {open &&
        (filtered.length > 0 ? (
          <div className="combo-menu">
            {filtered.map((o) => (
              <button type="button" key={o} onClick={() => pick(o)}>{o}</button>
            ))}
          </div>
        ) : (
          <div className="combo-menu">
            <div className="combo-empty">{t("fields.noResults")}</div>
          </div>
        ))}
    </div>
  );
}
