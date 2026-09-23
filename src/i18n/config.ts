export const locales = ["ar", "en"] as const;
export type Locale = (typeof locales)[number];

/** Arabic first: the store's primary audience. */
export const defaultLocale: Locale = "ar";

/** Cookie remembering an explicit language choice, so it beats Accept-Language on the next visit. */
export const localeCookie = "NEXT_LOCALE";

export const hasLocale = (value: string): value is Locale => (locales as readonly string[]).includes(value);

export const dirOf = (locale: Locale): "rtl" | "ltr" => (locale === "ar" ? "rtl" : "ltr");
