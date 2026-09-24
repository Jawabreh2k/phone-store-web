import type { Locale } from "@/i18n/config";

const intlLocale = (locale: Locale) => (locale === "ar" ? "ar-u-nu-latn" : "en");

export function staffFirstName(fullName: string): string {
  const trimmed = fullName.trim();
  if (!trimmed) return fullName;
  return trimmed.split(/\s+/)[0] ?? trimmed;
}

/**
 * A calendar date from the API ("2026-09-23", already the store's local day). It names a day, not an instant, so it
 * is read and written in UTC: formatting in any real zone could shift it a day on a server or browser far from the
 * store, and the server and browser renders would disagree.
 */
function formatCalendarDay(isoDay: string, locale: Locale, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(intlLocale(locale), { ...options, timeZone: "UTC" }).format(new Date(`${isoDay}T00:00:00Z`));
}

export const formatStoreDate = (isoDay: string, locale: Locale) => formatCalendarDay(isoDay, locale, { dateStyle: "full" });

export const formatChartDay = (isoDay: string, locale: Locale) => formatCalendarDay(isoDay, locale, { month: "short", day: "numeric" });

/** "3 hours ago", or days once it has been two days or more. */
export function relativeAge(iso: string, locale: Locale): string {
  const ms = Date.now() - new Date(iso).getTime();
  const rtf = new Intl.RelativeTimeFormat(intlLocale(locale), { numeric: "always" });
  const hours = Math.floor(ms / 3_600_000);
  if (hours >= 48) return rtf.format(-Math.floor(hours / 24), "day");
  if (hours >= 1) return rtf.format(-hours, "hour");
  return rtf.format(-Math.max(1, Math.floor(ms / 60_000)), "minute");
}

export function waitHours(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / 3_600_000;
}
