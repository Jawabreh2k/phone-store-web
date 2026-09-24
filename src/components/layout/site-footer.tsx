import Link from "next/link";
import { Suspense } from "react";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { api } from "@/lib/api/server";
import { formatPrice } from "@/lib/format";
import { Fill } from "@/components/ui/fill";
import { CheckIcon } from "@/components/ui/icons";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { StoreLogo } from "@/components/layout/store-logo";
import { brandSurface } from "@/components/ui/ui";

/**
 * Every page ends on the hero's indigo and grid: the store, where to shop, how to reach the shop and the
 * language. Keep it a <footer>: the product page's buy bar and the listing's filter button hide when it shows.
 */
export async function SiteFooter() {
  const [locale, dict] = await Promise.all([getLocale(), getDictionary()]);
  const settings = await api.settings(locale);
  const storeName = settings?.storeName ?? "PhoneStore";
  const whatsApp = settings?.whatsAppNumber?.replace(/\D/g, "");
  const hasContact = Boolean(settings?.supportPhone || whatsApp || settings?.supportEmail);
  const threshold = settings?.freeShippingThreshold;

  const heading = "mb-1 text-xs font-medium text-brand-foreground/60";
  const link = "inline-flex h-9 w-fit items-center gap-2 text-brand-foreground/80 transition-colors hover:text-brand-foreground pointer-coarse:h-11";

  return (
    <footer className={`${brandSurface} relative isolate mt-24 overflow-hidden sm:mt-32`}>
      <div aria-hidden className="bg-grid mask-fade-b pointer-events-none absolute inset-0 -z-10" />

      <div className="page-container grid gap-10 py-14 sm:grid-cols-2 sm:py-16 lg:grid-cols-[1.6fr_repeat(3,minmax(0,1fr))]">
        <div className="flex flex-col gap-4">
          {/* The link's accessible name comes from the visible store name (or the uploaded logo's alt). */}
          <Link href={`/${locale}`} className="w-fit rounded-lg">
            <StoreLogo storeName={storeName} logoUrl={settings?.logoUrl} inverse />
          </Link>
          <p className="max-w-xs text-sm leading-relaxed text-brand-foreground/70">{dict.home.heroSubtitle}</p>
        </div>

        <nav aria-labelledby="footer-shop" className="flex flex-col text-sm">
          <h2 id="footer-shop" className={heading}>
            {dict.footer.shop}
          </h2>
          <Link href={`/${locale}/products?type=Phone`} className={link}>
            {dict.nav.phones}
          </Link>
          <Link href={`/${locale}/products?type=Accessory`} className={link}>
            {dict.nav.accessories}
          </Link>
          <Link href={`/${locale}/products`} className={link}>
            {dict.catalog.allProducts}
          </Link>
          <Link href={`/${locale}/cart`} className={link}>
            {dict.nav.cart}
          </Link>
        </nav>

        {hasContact && (
          <div className="flex flex-col text-sm">
            <h2 className={heading}>{dict.footer.contact}</h2>
            {settings?.supportPhone && (
              <a href={`tel:${settings.supportPhone}`} dir="ltr" className={link}>
                {settings.supportPhone}
              </a>
            )}
            {whatsApp && (
              <a href={`https://wa.me/${whatsApp}`} target="_blank" rel="noopener noreferrer" className={link}>
                {dict.footer.whatsapp}
              </a>
            )}
            {settings?.supportEmail && (
              <a href={`mailto:${settings.supportEmail}`} dir="ltr" className={link}>
                {settings.supportEmail}
              </a>
            )}
          </div>
        )}

        <div className="flex flex-col text-sm">
          <h2 className={heading}>{dict.footer.language}</h2>
          <Suspense fallback={null}>
            <LanguageSwitcher label={dict.nav.switchLanguage} className={link} iconClassName="size-4 shrink-0" />
          </Suspense>
        </div>
      </div>

      <div className="page-container flex flex-col gap-3 border-t border-brand-foreground/10 py-6 text-xs text-brand-foreground/60 sm:flex-row sm:items-center sm:justify-between">
        <ul className="flex flex-wrap gap-x-6 gap-y-2">
          <li className="flex items-center gap-1.5">
            <CheckIcon className="size-3.5" />
            {dict.product.cashOnDelivery}
          </li>
          {threshold != null && (
            <li className="flex items-center gap-1.5">
              <CheckIcon className="size-3.5" />
              <span>
                <Fill template={dict.home.freeDelivery} values={{ amount: <bdi>{formatPrice(threshold, settings?.currencyCode ?? "JOD", locale)}</bdi> }} />
              </span>
            </li>
          )}
        </ul>
        <p>
          © {new Date().getFullYear()} {storeName}. {dict.footer.rights}
        </p>
      </div>
    </footer>
  );
}
