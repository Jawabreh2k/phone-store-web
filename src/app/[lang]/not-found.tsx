import Link from "next/link";
import { ProductArt } from "@/features/storefront/product-art";
import { ShopShell } from "@/components/layout/shop-shell";
import { StatePanel } from "@/components/ui/state-panel";
import { buttonPrimary, buttonSecondary } from "@/components/ui/ui";
import { getDictionary, getLocale } from "@/i18n/dictionaries";

export default async function NotFound() {
  const [locale, dict] = await Promise.all([getLocale(), getDictionary()]);

  return (
    <ShopShell locale={locale}>
      <StatePanel visual={<ProductArt type="Phone" colors={[]} className="h-20 w-auto" />} title={dict.common.notFoundTitle} body={dict.common.notFoundBody}>
        <Link href={`/${locale}`} className={buttonPrimary}>
          {dict.common.backHome}
        </Link>
        <Link href={`/${locale}/products`} className={buttonSecondary}>
          {dict.catalog.allProducts}
        </Link>
      </StatePanel>
    </ShopShell>
  );
}
