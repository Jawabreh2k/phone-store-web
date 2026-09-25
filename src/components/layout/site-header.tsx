import { Suspense } from "react";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { api } from "@/lib/api/server";
import { DEFAULT_STORE_NAME } from "@/lib/constants";
import { AuthErrorNotice } from "@/features/storefront/auth-error-notice";
import { SignInPrompt } from "@/features/storefront/sign-in-prompt";
import { HeaderShell } from "@/components/layout/header-shell";

/** Loads what the header shows on the server; the scroll/menu behaviour lives in the client-side HeaderShell. */
export async function SiteHeader() {
  const [locale, dict] = await Promise.all([getLocale(), getDictionary()]);
  const settings = await api.settings(locale);

  return (
    <>
      <HeaderShell
        locale={locale}
        storeName={settings?.storeName ?? DEFAULT_STORE_NAME}
        logoUrl={settings?.logoUrl ?? null}
        labels={{
          phones: dict.nav.phones,
          accessories: dict.nav.accessories,
          cart: dict.nav.cart,
          search: dict.nav.search,
          menu: dict.nav.menu,
          switchLanguage: dict.nav.switchLanguage,
          signIn: dict.nav.signIn,
          account: dict.nav.account,
          orders: dict.nav.orders,
          signOut: dict.nav.signOut,
        }}
        authLabels={dict.auth}
      />
      {/* A failed Google sign-in lands back on any storefront page; the notice floats under the header. */}
      <Suspense fallback={null}>
        <AuthErrorNotice errors={dict.auth.errors} dismissLabel={dict.auth.dismiss} />
      </Suspense>
      {/* Account pages send signed-out visitors home with ?signIn=<page>; this opens the dialog for them. */}
      <Suspense fallback={null}>
        <SignInPrompt locale={locale} labels={dict.auth} />
      </Suspense>
    </>
  );
}
