import { ShopShell } from "@/components/layout/shop-shell";
import { getLocale } from "@/i18n/dictionaries";

export default async function ShopLayout({ children }: LayoutProps<"/[lang]">) {
  const locale = await getLocale();
  return <ShopShell locale={locale}>{children}</ShopShell>;
}
