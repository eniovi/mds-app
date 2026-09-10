"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSession } from "@/lib/session-context";
import { useLanguage } from "@/lib/useLanguage";
import { LanguageSelector } from "./LanguageSelector";
import { ServerIcon } from "./icons/ServerIcon";
import { LogOutIcon } from "./icons/LogOutIcon";

/** The single global user-profile dropdown — mounted the same way on every
 * authenticated screen (TopBar + the tickets/environments/files headers).
 * Reads identity from SessionProvider (root layout) instead of each route
 * re-deriving it, so the menu can't drift or go missing per page. */
export function UserDropdownMenu() {
  const { user, logout } = useSession();
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
    <div className="avatar-menu" ref={wrapRef}>
      <button
        className="avatar"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        data-od-id="user-avatar-button"
      >
        {user.userInitials}
      </button>
      {open && (
        <div className="avatar-pop" role="menu" data-od-id="user-dropdown-menu">
          <div className="who">
            <b>{user.user}</b>
            <span>{user.role}</span>
          </div>
          <hr className="dropdown-sep" role="separator" />
          <Link
            href="/environments"
            className="dropdown-item"
            role="menuitem"
            onClick={() => setOpen(false)}
            data-od-id="menu-manage-environments"
          >
            <ServerIcon /> {t("userMenu.manageEnvironments")}
          </Link>
          <hr className="dropdown-sep" role="separator" />
          <LanguageSelector onSelect={() => setOpen(false)} />
          <hr className="dropdown-sep" role="separator" />
          <button
            className="dropdown-item destructive"
            role="menuitem"
            onClick={logout}
            data-od-id="menu-logout"
          >
            <LogOutIcon /> {t("userMenu.logout")}
          </button>
        </div>
      )}
    </div>
  );
}
