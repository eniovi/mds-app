"use client";

import { useTranslation } from "react-i18next";
import { writeString } from "./storage";
import { LANGUAGE_STORAGE_KEY, SUPPORTED_LANGUAGES } from "./i18n";
import type { Language } from "./i18n";

export { SUPPORTED_LANGUAGES };
export type { Language };

/** Wraps react-i18next's useTranslation with this app's persistence rule.
 * localStorage is the real, working store. The brief also asks to persist
 * to "a API de preferências do usuário" — there is no real backend
 * anywhere in this prototype (every other screen mocks its data the same
 * way, see README), so that half is intentionally a no-op today, isolated
 * in persistToUserPreferencesApi so it's obvious where a real
 * PATCH /api/user/preferences call would go once a backend exists. */
export function useLanguage() {
  const { t, i18n } = useTranslation();

  function setLanguage(lang: Language) {
    i18n.changeLanguage(lang);
    writeString(LANGUAGE_STORAGE_KEY, lang);
    persistToUserPreferencesApi(lang);
  }

  return { t, language: i18n.language as Language, setLanguage };
}

function persistToUserPreferencesApi(_lang: Language) {
  // Stand-in for a real backend call — see the doc comment above.
}
