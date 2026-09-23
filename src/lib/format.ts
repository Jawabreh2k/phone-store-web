import type { Locale } from "@/i18n/config";

const formatters = new Map<string, Intl.NumberFormat>();

/** Formats a price in the store currency. Arabic uses Latin digits, which read better for prices online. */
export function formatPrice(amount: number, currency: string, locale: Locale): string {
  const key = `${locale}:${currency}`;
  let formatter = formatters.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale === "ar" ? "ar-u-nu-latn" : "en", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
    formatters.set(key, formatter);
  }
  return formatter.format(amount);
}

/** Replaces {name} placeholders in a dictionary string. */
export function t(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? `{${key}}`));
}
