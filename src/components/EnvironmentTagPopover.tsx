"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ServerIcon } from "./icons/ServerIcon";
import { useEnvironments } from "@/lib/useEnvironments";
import { useLanguage } from "@/lib/useLanguage";
import { environmentKindMeta } from "@/lib/environment-meta";

interface EnvironmentTagPopoverProps {
  environmentId: string | undefined;
  onChange: (envId: string) => void;
}

/** Inline environment switcher for the active ticket — clicking either the
 * tag itself or the "Alterar Ambiente" button opens the same popover
 * (per spec, both are valid triggers). Reuses the exact dropdown
 * positioning/shadow language already established by Combobox/RevisionSelect
 * (.combo-menu-equivalent), not a new floating-panel style. */
export function EnvironmentTagPopover({ environmentId, onChange }: EnvironmentTagPopoverProps) {
  const { t } = useLanguage();
  const environments = useEnvironments();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const current = environments.find((e) => e.id === environmentId);
  const currentMeta = current ? environmentKindMeta(current.kind, t) : null;

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  function pick(envId: string) {
    onChange(envId);
    setOpen(false);
  }

  return (
    <div className="env-tag-popover-wrap" ref={wrapRef} data-od-id="ticket-env-selector">
      <div className="env-tag-row">
        <button
          type="button"
          className="env-tag-trigger"
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="listbox"
          aria-expanded={open}
          data-od-id="ticket-env-tag"
        >
          {current ? (
            <>
              <span className="env-tag-name">{current.name}</span>
              <span className={"badge " + currentMeta!.cls}><span className="badge-dot" />{currentMeta!.label}</span>
            </>
          ) : (
            <span className="text-muted">{t("envTagPopover.noneLinked")}</span>
          )}
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => setOpen((o) => !o)}
          data-od-id="ticket-env-change-button"
        >
          <ServerIcon size={14} /> {t("envTagPopover.changeEnvironment")}
        </button>
      </div>

      {open && (
        <div className="env-popover" role="listbox" aria-label={t("envTagPopover.selectAria")} data-od-id="ticket-env-popover">
          {environments.length === 0 ? (
            <div className="combo-empty">{t("environments.noneFound")}</div>
          ) : (
            environments.map((e) => {
              const meta = environmentKindMeta(e.kind, t);
              return (
                <button
                  type="button"
                  key={e.id}
                  className={"env-popover-option" + (e.id === environmentId ? " selected" : "")}
                  role="option"
                  aria-selected={e.id === environmentId}
                  onClick={() => pick(e.id)}
                  data-od-id={"ticket-env-option-" + e.id}
                >
                  <span>{e.name}</span>
                  <span className={"badge " + meta.cls}><span className="badge-dot" />{meta.label}</span>
                </button>
              );
            })
          )}
          <Link href="/environments" className="env-popover-manage-link" onClick={() => setOpen(false)}>
            {t("envTagPopover.manageLink")}
          </Link>
        </div>
      )}
    </div>
  );
}
