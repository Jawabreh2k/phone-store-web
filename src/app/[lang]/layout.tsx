import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { dirOf } from "@/i18n/config";
import { getLocale } from "@/i18n/dictionaries";
import { api } from "@/lib/api/server";
import "../globals.css";

// One family for both scripts keeps Arabic and Latin text visually consistent.
const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-arabic",
  display: "swap",
});

// No generateStaticParams: pages render on request (API responses are cached for a short time),
// so builds never depend on the API being up and stock/prices are never stale for long.

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const settings = await api.settings(locale);
  const storeName = settings?.storeName ?? "PhoneStore";
  return {
    title: { default: storeName, template: `%s | ${storeName}` },
    alternates: { languages: { ar: "/ar", en: "/en" } },
    openGraph: { siteName: storeName, locale: locale === "ar" ? "ar_AR" : "en_US", type: "website" },
  };
}

export default async function LocaleLayout({ children }: LayoutProps<"/[lang]">) {
  const locale = await getLocale();

  return (
    <html lang={locale} dir={dirOf(locale)} className={`${plexArabic.variable} h-full antialiased`}>
      <body className="relative isolate flex min-h-full flex-col font-sans">
        {/* Page background grid, fading out; the header is transparent at the top so it shares this surface. */}
        <div aria-hidden className="bg-grid mask-fade-b pointer-events-none absolute inset-x-0 top-0 -z-10 h-[42rem] opacity-60" />
        <SiteHeader />
        {/* The header is fixed (~70px), so content starts below it. Pages sit in the centred column unless a
            child opts into .full-bleed (the home hero). */}
        <main className="page-grid flex-1 pt-24 sm:pt-28">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
