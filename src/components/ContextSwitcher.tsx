"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowIcon } from "./icons/ArrowIcon";
import { useLanguage } from "@/lib/useLanguage";

export interface SwitcherItem {
  id: string;
  primary: string;
  secondary?: string;
  badge?: { label: string; cls: string };
}

interface ContextSwitcherProps {
  /** short caption above the value, e.g. "Cliente" / "Ticket" */
  caption: string;
  icon: React.ReactNode;
  /** current selection, or null while nothing is picked */
  value: string | null;
  emptyLabel: string;
  items: SwitcherItem[];
  activeId: string | null;
  onSelect: (id: string) => void;
  emptyListLabel: string;
  manageHref: string;
  manageLabel: string;
  odId: string;
}

/** The persistent context control in the global header: one for the client,
 * one for the ticket. Reuses the dropdown language EnvironmentTagPopover and
 * Combobox already established (.combo-menu positioning + shadow) rather than
 * inventing a third floating-panel style, and behaves like them too — click
 * outside or Escape closes it. Switching from here never navigates: the point
 * is to change context without losing the screen you are on. */
export function ContextSwitcher({
  caption, icon, value, emptyLabel, items, activeId, onSelect,
  emptyListLabel, manageHref, manageLabel, odId,
}: ContextSwitcherProps) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="ctx-switcher" ref={wrapRef} data-od-id={odId}>
      <button
        type="button"
        className="ctx-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        data-od-id={odId + "-trigger"}
      >
        <span className="ctx-icon">{icon}</span>
        <span className="ctx-text">
          <span className="ctx-caption">{caption}</span>
          <span className="ctx-value">{value || emptyLabel}</span>
        </span>
        <span className="ctx-switch-hint">{t("context.switch")}</span>
        <ArrowIcon direction={open ? "up" : "down"} size={13} />
      </button>

      {open && (
        <div className="ctx-menu" role="listbox" aria-label={caption} data-od-id={odId + "-menu"}>
          {items.length === 0 ? (
            <div className="combo-empty">{emptyListLabel}</div>
          ) : (
            items.map((item) => (
              <button
                type="button"
                key={item.id}
                role="option"
                aria-selected={item.id === activeId}
                className={"ctx-option" + (item.id === activeId ? " selected" : "")}
                onClick={() => {
                  onSelect(item.id);
                  setOpen(false);
                }}
                data-od-id={odId + "-option-" + item.id}
              >
                <span className="ctx-option-text">
                  <span className="ctx-option-primary">{item.primary}</span>
                  {item.secondary && <span className="ctx-option-secondary">{item.secondary}</span>}
                </span>
                {item.badge && (
                  <span className={"badge " + item.badge.cls}><span className="badge-dot" />{item.badge.label}</span>
                )}
              </button>
            ))
          )}
          <Link href={manageHref} className="ctx-manage-link" onClick={() => setOpen(false)}>
            {manageLabel}
          </Link>
        </div>
      )}
    </div>
  );
}
