type TFunc = (key: string, options?: Record<string, unknown>) => string;

/** Relative "when" label. Takes `t` for the same reason formatDateTime takes a
 * locale: this string is user-facing chrome, so it has to follow the selected
 * language instead of staying pt-BR forever (see LOCALE_BY_LANGUAGE in
 * lib/i18n). */
export function timeAgo(iso: string, t: TFunc): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return t("common.timeAgo.now");
  if (min < 60) return t("common.timeAgo.minutes", { count: min });
  const h = Math.floor(min / 60);
  return t("common.timeAgo.hours", { count: h });
}

export function formatDateTime(iso: string, locale = "pt-BR"): string {
  return new Date(iso).toLocaleString(locale, { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function formatDate(iso: string, locale = "pt-BR"): string {
  return new Date(iso).toLocaleDateString(locale);
}
