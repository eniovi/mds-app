import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import pt from "./locales/pt.json";
import en from "./locales/en.json";
import es from "./locales/es.json";

export const SUPPORTED_LANGUAGES = ["pt", "en", "es"] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];

export const LANGUAGE_STORAGE_KEY = "mds_language";

/** BCP-47 locale per supported language — shared by I18nProvider (syncs
 * <html lang>) and every Date#toLocaleString/toLocaleDateString call in the
 * app, so date/time formatting actually follows the selected language
 * instead of staying pt-BR forever. */
export const LOCALE_BY_LANGUAGE: Record<Language, string> = { pt: "pt-BR", en: "en-US", es: "es-ES" };

/** i18next always boots with "pt" on both server and first client render —
 * I18nProvider switches to the persisted language in a useEffect after
 * mount, the same SSR-safe pattern lib/storage.ts documents for every other
 * localStorage-backed value in this app (never read localStorage in a
 * render-time initializer, or server/client output won't match). The
 * isInitialized guard keeps re-imports (Fast Refresh, multiple entry
 * points) from calling .init() more than once. */
if (!i18next.isInitialized) {
  i18next.use(initReactI18next).init({
    resources: {
      pt: { translation: pt },
      en: { translation: en },
      es: { translation: es },
    },
    lng: "pt",
    fallbackLng: "pt",
    interpolation: { escapeValue: false },
  });
}

export default i18next;
