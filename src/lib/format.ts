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

/** The currency as the locale writes it beside a price ("JOD", "د.أ."), for labels such as "Price (JOD)". */
export function currencyLabel(currency: string, locale: Locale): string {
  const parts = new Intl.NumberFormat(locale === "ar" ? "ar-u-nu-latn" : "en", { style: "currency", currency }).formatToParts(0);
  return parts.find((part) => part.type === "currency")?.value ?? currency;
}

/** Replaces {name} placeholders in a dictionary string. */
export function t(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? `{${key}}`));
}

/** One dictionary string per CLDR plural category; Arabic uses all six (e.g. منتجان, 3 منتجات, 11 منتجاً). */
export type PluralForms = Record<Intl.LDMLPluralRule, string>;

/** Picks the plural form for `count` in the locale and fills {count}. */
export function plural(forms: PluralForms, count: number, locale: Locale): string {
  return t(forms[new Intl.PluralRules(locale).select(count)], { count });
}
