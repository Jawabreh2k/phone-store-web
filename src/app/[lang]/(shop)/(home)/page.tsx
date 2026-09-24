import Link from "next/link";
import type { ReactNode } from "react";
import { Fill } from "@/components/ui/fill";
import { HomeHero } from "@/features/storefront/home-hero";
import { ArrowIcon, CashIcon, RouteIcon, TruckIcon } from "@/components/ui/icons";
import { ProductArt } from "@/features/storefront/product-art";
import { ProductGrid } from "@/features/storefront/product-grid";
import { SectionHeading } from "@/components/ui/section-heading";
import { brandSurface, chipIdle, panel } from "@/components/ui/ui";
import type { Locale } from "@/i18n/config";
import { getDictionary, getLocale, type Dictionary } from "@/i18n/dictionaries";
import { api } from "@/lib/api/server";
import type { Category, PagedResult, ProductSummary, PublicSettings } from "@/lib/api/types";
import { formatPrice, plural } from "@/lib/format";

export default async function HomePage() {
  const [locale, dict] = await Promise.all([getLocale(), getDictionary()]);
  const [settings, brands, categories, phones, accessories] = await Promise.all([
    api.settings(locale),
    api.brands(locale),
    api.categories(locale, "Accessory"),
    api.products(locale, { type: "Phone", sort: "Featured", pageSize: 8 }),
    api.products(locale, { type: "Accessory", sort: "Featured", pageSize: 8 }),
  ]);
  const currency = settings?.currencyCode ?? "JOD";
  const count = (result: PagedResult<ProductSummary> | null) => plural(dict.catalog.productCount, result?.totalCount ?? 0, locale);

  return (
    // Full-bleed and pulled up under the fixed header, so the hero's colour runs behind the navigation.
    <div className="full-bleed -mt-24 flex flex-col gap-16 sm:-mt-28 sm:gap-24">
      <HomeHero locale={locale} dict={dict} settings={settings} phones={phones?.items ?? []} brands={brands ?? []} />

      <div className="page-container flex flex-col gap-16 sm:gap-24">
        <section aria-labelledby="home-categories" className="flex flex-col gap-6 sm:gap-8">
          <SectionHeading id="home-categories" title={dict.home.shopByCategory} />
          <CategoryTiles
            locale={locale}
            dict={dict}
            phones={{ count: count(phones), colors: phones?.items[0]?.colorHexes ?? [] }}
            accessories={{ count: count(accessories), colors: accessories?.items[0]?.colorHexes ?? [] }}
            categories={categories ?? []}
          />
        </section>

        <section aria-labelledby="home-phones" className="flex flex-col gap-6 sm:gap-8">
          <SectionHeading
            id="home-phones"
            eyebrow={dict.home.featured}
            title={dict.catalog.phones}
            href={`/${locale}/products?type=Phone`}
            linkLabel={dict.home.viewAll}
          />
          <ProductGrid
            products={phones?.items ?? []}
            locale={locale}
            currency={currency}
            dict={dict.catalog}
            endCap={{ href: `/${locale}/products?type=Phone`, title: dict.home.viewAllPhones, caption: count(phones) }}
          />
        </section>

        <Promises dict={dict} settings={settings} locale={locale} />

        <section aria-labelledby="home-accessories" className="flex flex-col gap-6 sm:gap-8">
          <SectionHeading
            id="home-accessories"
            eyebrow={dict.home.accessoriesEyebrow}
            title={dict.catalog.accessories}
            href={`/${locale}/products?type=Accessory`}
            linkLabel={dict.home.viewAll}
          />
          <ProductGrid
            products={accessories?.items ?? []}
            locale={locale}
            currency={currency}
            dict={dict.catalog}
            endCap={{ href: `/${locale}/products?type=Accessory`, title: dict.home.viewAllAccessories, caption: count(accessories) }}
          />
        </section>
      </div>
    </div>
  );
}

/**
 * The two ways into the catalogue: phones on the indigo surface (the hero's colour, once more), accessories on
 * paper, each with its stand-in art; then the accessory sub-categories as chips.
 */
function CategoryTiles({
  locale,
  dict,
  phones,
  accessories,
  categories,
}: {
  locale: Locale;
  dict: Dictionary;
  phones: { count: string; colors: string[] };
  accessories: { count: string; colors: string[] };
  categories: Category[];
}) {
  const tile = "group relative isolate flex min-h-48 flex-col overflow-hidden rounded-card p-5 transition-shadow duration-300 hover:shadow-lift sm:min-h-64 sm:p-7";
  const title = "mt-1 text-2xl font-semibold tracking-tight sm:text-4xl";
  const go = "mt-auto inline-flex size-11 items-center justify-center rounded-full transition-transform duration-300 motion-safe:group-hover:translate-x-1 rtl:motion-safe:group-hover:-translate-x-1";
  const art = "pointer-events-none absolute -bottom-8 -end-6 -z-10 h-[78%] w-auto transition-transform duration-500 motion-safe:group-hover:-translate-y-1 sm:-bottom-16 sm:end-6 sm:h-[122%]";

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-[1.2fr_1fr] sm:gap-4">
        <Link href={`/${locale}/products?type=Phone`} className={`${brandSurface} bg-grid ${tile}`}>
          <span className="text-sm text-brand-foreground/70">{phones.count}</span>
          <span className={title}>{dict.catalog.phones}</span>
          <span className={`${go} bg-brand-foreground text-brand`}>
            <ArrowIcon />
          </span>
          <ProductArt type="Phone" colors={phones.colors} className={`${art} -rotate-6`} />
        </Link>
        <Link href={`/${locale}/products?type=Accessory`} className={`${panel} ${tile}`}>
          <span className="text-sm text-muted">{accessories.count}</span>
          <span className={title}>{dict.catalog.accessories}</span>
          <span className={`${go} border border-border`}>
            <ArrowIcon />
          </span>
          <ProductArt type="Accessory" colors={accessories.colors} className={art} />
        </Link>
      </div>

      {categories.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label={dict.catalog.accessories}>
          {categories.map((category) => (
            <li key={category.id}>
              <Link href={`/${locale}/products?type=Accessory&category=${category.slug}`} className={chipIdle}>
                {category.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** What every order gets, from real store settings only (no invented claims): the hero's floating cards, on paper. */
function Promises({ dict, settings, locale }: { dict: Dictionary; settings: PublicSettings | null; locale: Locale }) {
  const price = (amount: number) => <bdi>{formatPrice(amount, settings?.currencyCode ?? "JOD", locale)}</bdi>;
  const fee = settings?.flatShippingFee;
  const threshold = settings?.freeShippingThreshold;

  let delivery: ReactNode = null;
  if (fee === 0) delivery = dict.home.promiseDeliveryAlwaysFree;
  else if (fee != null && threshold != null) delivery = <Fill template={dict.home.promiseDeliveryFree} values={{ amount: price(threshold), fee: price(fee) }} />;
  else if (fee != null) delivery = <Fill template={dict.home.promiseDeliveryFlat} values={{ fee: price(fee) }} />;

  const items = [
    { icon: <CashIcon className="size-[1.125rem]" />, tone: "bg-success", title: dict.home.promiseCodTitle, body: dict.home.promiseCodBody },
    { icon: <TruckIcon className="size-[1.125rem]" />, tone: "bg-brand", title: dict.home.promiseDeliveryTitle, body: delivery },
    { icon: <RouteIcon className="size-[1.125rem]" />, tone: "bg-brand", title: dict.home.promiseTrackTitle, body: dict.home.promiseTrackBody },
  ];

  return (
    <section aria-label={dict.home.promisesLabel}>
      <ul className="grid gap-3 sm:grid-cols-3 sm:gap-4">
        {items.map((item) => (
          <li key={item.title} className={`${panel} flex items-start gap-4 p-5`}>
            <span className={`inline-flex size-10 shrink-0 items-center justify-center rounded-full text-brand-foreground ${item.tone}`}>{item.icon}</span>
            <div className="flex flex-col gap-1">
              <h3 className="font-semibold">{item.title}</h3>
              {item.body && <p className="text-sm leading-relaxed text-muted">{item.body}</p>}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
