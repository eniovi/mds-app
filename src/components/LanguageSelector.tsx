"use client";

import { useLanguage } from "@/lib/useLanguage";
import type { Language } from "@/lib/useLanguage";

const LANGUAGES: { code: Language; flag: string; native: string }[] = [
  { code: "pt", flag: "🇧🇷", native: "Português" },
  { code: "en", flag: "🇺🇸", native: "English" },
  { code: "es", flag: "🇪🇸", native: "Español" },
];

/** DS directive: Select/DropdownMenu pattern with readable flag icons — lives
 * inside UserDropdownMenu's already-open popover rather than opening a
 * second nested popover of its own (simpler, no extra z-index/positioning
 * surface). Rendered as role="menuitemradio" rows (a mutually-exclusive
 * choice inside a role="menu"), which is the correct ARIA pattern for a
 * Select embedded in a menu — this satisfies the brief's screen-reader
 * requirement more directly than a plain button list would. */
export function LanguageSelector({ onSelect }: { onSelect?: () => void }) {
  const { t, language, setLanguage } = useLanguage();

  return (
    <div className="dropdown-lang-section" role="group" aria-label={t("userMenu.languageAriaLabel")} data-od-id="language-selector">
      <span className="dropdown-lang-label">{t("userMenu.language")}</span>
      {LANGUAGES.map((l) => {
        const active = language === l.code;
        return (
          <button
            type="button"
            key={l.code}
            className={"dropdown-item lang-item" + (active ? " active" : "")}
            role="menuitemradio"
            aria-checked={active}
            aria-label={`${l.native} (${l.code.toUpperCase()})`}
            onClick={() => {
              setLanguage(l.code);
              onSelect?.();
            }}
            data-od-id={"language-option-" + l.code}
          >
            <span className="lang-flag" aria-hidden="true">{l.flag}</span>
            <span className="lang-name">{l.native}</span>
            <span className="lang-code">{l.code.toUpperCase()}</span>
            {active && (
              <svg className="lang-check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 12.5l5.5 5.5L20 7" />
              </svg>
            )}
          </button>
        );
      })}
    </div>
  );
}
