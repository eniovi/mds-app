"use client";

import { useEffect, useRef, useState } from "react";
import { fetchArtifactNames } from "@/lib/mif-artifacts";
import { useLanguage } from "@/lib/useLanguage";
import type { FieldValue, TaskField } from "@/lib/types";

interface AsyncCatalogFieldProps {
  field: TaskField;
  value: FieldValue | undefined;
  scopeValue: string | undefined;
  onChange: (value: FieldValue) => void;
  invalid: boolean;
}

/** Same search+chips interaction as the synchronous Combobox (reused
 * verbatim: .combo/.combo-menu/.chips/.chip), but the option list comes
 * from a simulated Maximo API call per scopeValue (the selected tab) and
 * shows a Skeleton while in flight. requestId guards against a stale
 * response from a since-abandoned type landing after a newer one. */
export function AsyncCatalogField({ field, value, scopeValue, onChange, invalid }: AsyncCatalogFieldProps) {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<string[]>([]);
  const wrapRef = useRef<HTMLDivElement>(null);
  const requestId = useRef(0);

  const multiple = !!field.multiple;
  const arrayValue = Array.isArray(value) ? value : [];
  const singleValue = typeof value === "string" ? value : "";
  const selected = multiple ? arrayValue : singleValue ? [singleValue] : [];

  useEffect(() => {
    if (!scopeValue) {
      setOptions([]);
      return;
    }
    const id = ++requestId.current;
    setLoading(true);
    fetchArtifactNames(scopeValue).then((names) => {
      if (requestId.current === id) {
        setOptions(names);
        setLoading(false);
      }
    });
  }, [scopeValue]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  if (!scopeValue) {
    return <div className="combo-disabled">{t("fields.selectArtifactTypeFirst")}</div>;
  }

  if (loading) {
    return (
      <div className="ds-skeleton-group" aria-live="polite" aria-busy="true" data-od-id={"field-" + field.id + "-loading"}>
        <span className="visually-hidden">{t("fields.loadingArtifacts")}</span>
        <div className="ds-skeleton ds-skeleton-input" />
        <div className="ds-skeleton ds-skeleton-row" />
        <div className="ds-skeleton ds-skeleton-row" />
        <div className="ds-skeleton ds-skeleton-row" />
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
          <div className="combo-menu"><div className="combo-empty">{t("fields.noArtifactsFound")}</div></div>
        ))}
    </div>
  );
}
