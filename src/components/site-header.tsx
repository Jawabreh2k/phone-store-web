import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { api } from "@/lib/api/server";
import { HeaderShell } from "./header-shell";

/** Loads what the header shows on the server; the scroll/menu behaviour lives in the client-side HeaderShell. */
export async function SiteHeader() {
  const [locale, dict] = await Promise.all([getLocale(), getDictionary()]);
  const settings = await api.settings(locale);

  return (
    <HeaderShell
      locale={locale}
      storeName={settings?.storeName ?? "PhoneStore"}
      logoUrl={settings?.logoUrl ?? null}
      labels={{
        phones: dict.nav.phones,
        accessories: dict.nav.accessories,
        cart: dict.nav.cart,
        search: dict.nav.search,
        menu: dict.nav.menu,
        switchLanguage: dict.nav.switchLanguage,
      }}
    />
  );
}
