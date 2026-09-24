import { CartProvider } from "@/features/storefront/cart-provider";
import { SessionProvider } from "@/features/storefront/session-provider";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import type { Locale } from "@/i18n/config";

/** Storefront chrome: grid background, cart, header, centred main column, footer. */
export function ShopShell({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return (
    <>
      <div aria-hidden className="bg-grid mask-fade-b pointer-events-none absolute inset-x-0 top-0 -z-10 h-[42rem] opacity-60" />
      <CartProvider locale={locale}>
        <SessionProvider locale={locale}>
          <SiteHeader />
          <main className="page-grid flex-1 pt-24 sm:pt-28">{children}</main>
          <SiteFooter />
        </SessionProvider>
      </CartProvider>
    </>
  );
}
