import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, hasLocale, localeCookie, locales, type Locale } from "@/i18n/config";

/**
 * Sends locale-less URLs (e.g. "/", "/products/x") to their localized path.
 * Choice order: explicit cookie, then the browser's Accept-Language, then Arabic.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const first = pathname.split("/")[1] ?? "";
  if (hasLocale(first)) return;

  const url = request.nextUrl.clone();
  url.pathname = `/${pickLocale(request)}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

function pickLocale(request: NextRequest): Locale {
  const fromCookie = request.cookies.get(localeCookie)?.value;
  if (fromCookie && hasLocale(fromCookie)) return fromCookie;

  // "ar-JO,ar;q=0.9,en;q=0.8" → first supported primary language tag, by weight.
  const accepted = (request.headers.get("accept-language") ?? "")
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { lang: tag.split("-")[0].toLowerCase(), weight: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.weight - a.weight)
    .find((entry) => (locales as readonly string[]).includes(entry.lang));

  return (accepted?.lang as Locale | undefined) ?? defaultLocale;
}

export const config = {
  // Skip the API/upload proxies, Next internals and any file with an extension (favicon.ico, images…).
  matcher: ["/((?!api|uploads|_next|.*\\..*).*)"],
};
