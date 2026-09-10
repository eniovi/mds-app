"use client";

import { useEffect } from "react";
import { I18nextProvider } from "react-i18next";
import i18next, { LANGUAGE_STORAGE_KEY, LOCALE_BY_LANGUAGE, SUPPORTED_LANGUAGES } from "@/lib/i18n";
import { readString } from "@/lib/storage";
import type { Language } from "@/lib/i18n";

/** Mounted once in the root layout, alongside SessionProvider. Reads the
 * persisted language preference and syncs <html lang> (screen readers use
 * it, per the brief's accessibility requirement) — both done in effects,
 * never at render time, to avoid a hydration mismatch against the server's
 * fixed "pt" render. */
export function I18nProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const saved = readString(LANGUAGE_STORAGE_KEY) as Language | null;
    if (saved && (SUPPORTED_LANGUAGES as readonly string[]).includes(saved) && saved !== i18next.language) {
      i18next.changeLanguage(saved);
    }
  }, []);

  useEffect(() => {
    function syncHtmlLang(lang: string) {
      document.documentElement.lang = LOCALE_BY_LANGUAGE[lang as Language] || "pt-BR";
    }
    syncHtmlLang(i18next.language);
    i18next.on("languageChanged", syncHtmlLang);
    return () => {
      i18next.off("languageChanged", syncHtmlLang);
    };
  }, []);

  return <I18nextProvider i18n={i18next}>{children}</I18nextProvider>;
}
