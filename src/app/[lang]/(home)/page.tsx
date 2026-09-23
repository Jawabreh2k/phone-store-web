import Link from "next/link";
import { HomeHero } from "@/components/home-hero";
import { ArrowIcon } from "@/components/icons";
import { ProductGrid } from "@/components/product-grid";
import { textLink } from "@/components/ui";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { api } from "@/lib/api/server";

export default async function HomePage() {
  const [locale, dict] = await Promise.all([getLocale(), getDictionary()]);
  const [settings, brands, phones, accessories] = await Promise.all([
    api.settings(locale),
    api.brands(locale),
    api.products(locale, { type: "Phone", sort: "Featured", pageSize: 8 }),
    api.products(locale, { type: "Accessory", sort: "Featured", pageSize: 4 }),
  ]);
  const currency = settings?.currencyCode ?? "JOD";

  return (
    // Full-bleed and pulled up under the fixed header, so the hero's colour runs behind the navigation.
    <div className="full-bleed -mt-24 flex flex-col gap-16 sm:-mt-28 sm:gap-20">
      <HomeHero locale={locale} dict={dict} settings={settings} phones={phones?.items ?? []} brands={brands ?? []} />

      <div className="page-container flex flex-col gap-16 sm:gap-20">
        <Section title={dict.catalog.phones} href={`/${locale}/products?type=Phone`} linkLabel={dict.home.viewAll}>
          <ProductGrid products={phones?.items ?? []} locale={locale} currency={currency} dict={dict.catalog} />
        </Section>

        <Section title={dict.catalog.accessories} href={`/${locale}/products?type=Accessory`} linkLabel={dict.home.viewAll}>
          <ProductGrid products={accessories?.items ?? []} locale={locale} currency={currency} dict={dict.catalog} />
        </Section>
      </div>
    </div>
  );
}

function Section({ title, href, linkLabel, children }: { title: string; href: string; linkLabel: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-end justify-between gap-4 border-b border-border pb-4">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
        <Link href={href} className={`${textLink} inline-flex items-center gap-1.5`}>
          {linkLabel}
          <ArrowIcon />
        </Link>
      </div>
      {children}
    </section>
  );
}
