"use client";

import { useSyncExternalStore } from "react";
import type { Locale } from "@/i18n/config";

const subscribe = () => () => {};

function format(iso: string, locale: Locale, timeZone?: string): string {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-u-nu-latn" : "en", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  }).format(new Date(iso));
}

/**
 * A timestamp in the shopper's own time zone. The server doesn't know it, so the server render
 * (and hydration) uses UTC, then the browser switches to local time without a hydration mismatch.
 */
export function LocalDateTime({ iso, locale }: { iso: string; locale: Locale }) {
  const text = useSyncExternalStore(
    subscribe,
    () => format(iso, locale),
    () => format(iso, locale, "UTC"),
  );
  return <time dateTime={iso}>{text}</time>;
}
