import Link from "next/link";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { api } from "@/lib/api/server";
import { eyebrow } from "./ui";

export async function SiteFooter() {
  const [locale, dict] = await Promise.all([getLocale(), getDictionary()]);
  const settings = await api.settings(locale);
  const storeName = settings?.storeName ?? "PhoneStore";
  const whatsApp = settings?.whatsAppNumber?.replace(/\D/g, "");
  const hasContact = Boolean(settings?.supportPhone || whatsApp || settings?.supportEmail);

  return (
    <footer className="mt-24 border-t border-border">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:grid-cols-3 sm:px-6">
        <div className="flex flex-col gap-2">
          <p className="text-lg font-semibold">{storeName}</p>
          <p className="max-w-xs text-sm text-muted">{dict.home.heroSubtitle}</p>
        </div>

        <nav className="flex flex-col gap-3 text-sm">
          <Link href={`/${locale}/products?type=Phone`} className="w-fit hover:text-brand">{dict.nav.phones}</Link>
          <Link href={`/${locale}/products?type=Accessory`} className="w-fit hover:text-brand">{dict.nav.accessories}</Link>
        </nav>

        {hasContact && (
          <div className="flex flex-col gap-3 text-sm">
            <p className={eyebrow}>{dict.footer.contact}</p>
            {settings?.supportPhone && (
              <a href={`tel:${settings.supportPhone}`} dir="ltr" className="w-fit hover:text-brand">
                {settings.supportPhone}
              </a>
            )}
            {whatsApp && (
              <a href={`https://wa.me/${whatsApp}`} target="_blank" rel="noopener noreferrer" className="w-fit hover:text-brand">
                {dict.footer.whatsapp}
              </a>
            )}
            {settings?.supportEmail && (
              <a href={`mailto:${settings.supportEmail}`} dir="ltr" className="w-fit hover:text-brand">
                {settings.supportEmail}
              </a>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-border">
        <p className="mx-auto max-w-7xl px-4 py-5 text-xs text-muted sm:px-6">
          © {new Date().getFullYear()} {storeName}. {dict.footer.rights}
        </p>
      </div>
    </footer>
  );
}
