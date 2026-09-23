import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { FilterPanel, FilterSheet, SortSelect, type FilterGroup, type FilterLabels, type FilterState } from "@/components/catalog-controls";
import { Fill } from "@/components/fill";
import { CloseIcon } from "@/components/icons";
import { Pagination } from "@/components/pagination";
import { ProductArt } from "@/components/product-art";
import { ProductGrid } from "@/components/product-grid";
import { buttonGhost, buttonPrimary, buttonSecondary, chipRemovable, pageTitle, panel, panelTitle, segment, segmented, swipeRow } from "@/components/ui";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { api } from "@/lib/api/server";
import type { ProductSort, ProductType } from "@/lib/api/types";
import { currencyLabel, formatPrice, plural, t } from "@/lib/format";

const productTypes: ProductType[] = ["Phone", "Accessory"];
const sorts: ProductSort[] = ["Featured", "Newest", "PriceAsc", "PriceDesc"];

type SearchParams = Awaited<PageProps<"/[lang]/products">["searchParams"]>;

/** Reads a single query value and keeps it only if it is one of the allowed options. */
function pick<T extends string>(params: SearchParams, key: string, allowed?: readonly T[]): T | undefined {
  const raw = params[key];
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return undefined;
  return !allowed || allowed.includes(value as T) ? (value as T) : undefined;
}

/** A price bound from the query: a non-negative number, or nothing. */
function pickPrice(params: SearchParams, key: string): number | undefined {
  const value = Number(pick(params, key));
  return Number.isFinite(value) && value >= 0 ? value : undefined;
}

export async function generateMetadata({ searchParams }: PageProps<"/[lang]/products">): Promise<Metadata> {
  const dict = await getDictionary();
  const type = pick(await searchParams, "type", productTypes);
  return { title: type === "Phone" ? dict.catalog.phones : type === "Accessory" ? dict.catalog.accessories : dict.catalog.allProducts };
}

export default async function ProductsPage({ searchParams }: PageProps<"/[lang]/products">) {
  const [locale, dict, params] = await Promise.all([getLocale(), getDictionary(), searchParams]);

  const type = pick(params, "type", productTypes);
  const brand = pick(params, "brand");
  const category = pick(params, "category");
  const search = pick(params, "search");
  const sort = pick(params, "sort", sorts) ?? "Featured";
  const page = Math.max(1, Number(pick(params, "page")) || 1);
  const inStock = pick(params, "inStock") === "1";
  // The API rejects a maximum below the minimum, so a reversed range is read the way it was meant.
  let minPrice = pickPrice(params, "minPrice");
  let maxPrice = pickPrice(params, "maxPrice");
  if (minPrice !== undefined && maxPrice !== undefined && maxPrice < minPrice) [minPrice, maxPrice] = [maxPrice, minPrice];

  const [settings, brands, categories, result] = await Promise.all([
    api.settings(locale),
    api.brands(locale, type),
    // Categories belong to a type (phones have one, accessories several), so they are offered once a type is chosen.
    type ? api.categories(locale, type) : null,
    api.products(locale, { type, brand, category, search, sort, page, minPrice, maxPrice, inStockOnly: inStock || undefined }),
  ]);

  const currency = settings?.currencyCode ?? "JOD";
  const money = (amount: number) => formatPrice(amount, currency, locale);

  // Every control is a link or a GET form over these values, so each filtered view has a shareable URL.
  const current = { type, brand, category, search, sort: sort === "Featured" ? undefined : sort, minPrice, maxPrice, inStock: inStock ? "1" : undefined };
  const href = (changes: Partial<Record<keyof typeof current | "page", string | number | undefined>>) => {
    const next = new URLSearchParams();
    for (const [key, value] of Object.entries({ ...current, page: undefined, ...changes })) {
      if (value !== undefined && value !== "") next.set(key, String(value));
    }
    const query = next.toString();
    return `/${locale}/products${query ? `?${query}` : ""}`;
  };

  const typeTitle = type === "Phone" ? dict.catalog.phones : type === "Accessory" ? dict.catalog.accessories : dict.catalog.allProducts;
  const categoryName = categories?.find((c) => c.slug === category)?.name;
  const brandName = brands?.find((b) => b.slug === brand)?.name ?? brand;

  const groups: FilterGroup[] = [];
  if (categories && categories.length > 1) {
    groups.push({
      name: "category",
      legend: dict.catalog.category,
      options: [
        { value: "", label: dict.catalog.allCategories, checked: !category, href: href({ category: undefined }) },
        ...categories.map((c) => ({ value: c.slug, label: c.name, checked: category === c.slug, href: href({ category: c.slug }) })),
      ],
    });
  }
  groups.push({
    name: "brand",
    legend: dict.catalog.brand,
    options: [
      { value: "", label: dict.catalog.allBrands, checked: !brand, href: href({ brand: undefined }) },
      ...(brands ?? []).map((b) => ({ value: b.slug, label: b.name, checked: brand === b.slug, href: href({ brand: b.slug }) })),
    ],
  });

  // Applied filters, each a link that drops it. The product type is not one: the tabs above show it.
  const applied: { key: string; label: ReactNode; name: string; href: string }[] = [];
  if (search) applied.push({ key: "search", label: <bdi>“{search}”</bdi>, name: search, href: href({ search: undefined }) });
  if (categoryName) applied.push({ key: "category", label: categoryName, name: categoryName, href: href({ category: undefined }) });
  if (brandName) applied.push({ key: "brand", label: brandName, name: brandName, href: href({ brand: undefined }) });
  if (minPrice !== undefined || maxPrice !== undefined) {
    const [template, values] =
      minPrice !== undefined && maxPrice !== undefined
        ? [dict.catalog.priceRange, { min: money(minPrice), max: money(maxPrice) }]
        : minPrice !== undefined
          ? [dict.catalog.priceFrom, { min: money(minPrice) }]
          : [dict.catalog.priceUpTo, { max: money(maxPrice!) }];
    const nodes = Object.fromEntries(Object.entries(values).map(([key, value]) => [key, <bdi key={key}>{value}</bdi>]));
    applied.push({ key: "price", label: <Fill template={template} values={nodes} />, name: t(template, values), href: href({ minPrice: undefined, maxPrice: undefined }) });
  }
  if (inStock) applied.push({ key: "stock", label: dict.catalog.inStockOnly, name: dict.catalog.inStockOnly, href: href({ inStock: undefined }) });
  const clearHref = href({ brand: undefined, category: undefined, search: undefined, minPrice: undefined, maxPrice: undefined, inStock: undefined });

  const keep: Record<string, string> = {};
  if (type) keep.type = type;
  if (search) keep.search = search;
  if (current.sort) keep.sort = current.sort;
  const filters: FilterState = {
    action: `/${locale}/products`,
    keep,
    groups,
    minPrice,
    maxPrice,
    inStock,
    activeCount: applied.filter((a) => a.key !== "search").length,
  };
  const filterLabels: FilterLabels = {
    filters: dict.catalog.filters,
    showResults: dict.catalog.showResults,
    reset: dict.catalog.reset,
    price: t(dict.catalog.price, { currency: currencyLabel(currency, locale) }),
    priceMin: dict.catalog.priceMin,
    priceMax: dict.catalog.priceMax,
    apply: dict.catalog.apply,
    inStockOnly: dict.catalog.inStockOnly,
    close: dict.product.close,
  };

  const sortLabels: Record<ProductSort, string> = {
    Featured: dict.catalog.sortFeatured,
    Newest: dict.catalog.sortNewest,
    PriceAsc: dict.catalog.sortPriceAsc,
    PriceDesc: dict.catalog.sortPriceDesc,
    NameAsc: dict.catalog.sortFeatured,
  };
  const sortOptions = sorts.map((s) => ({ value: s, label: sortLabels[s], href: href({ sort: s === "Featured" ? undefined : s }) }));

  const items = result?.items ?? [];

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <header className="flex flex-col gap-3">
        <Breadcrumbs
          label={dict.catalog.breadcrumb}
          items={[
            { label: dict.nav.home, href: `/${locale}` },
            ...(categoryName && type ? [{ label: typeTitle, href: `/${locale}/products?type=${type}` }] : []),
            { label: search ? `“${search}”` : (categoryName ?? typeTitle) },
          ]}
        />
        <h1 className={pageTitle}>{search ? <bdi>“{search}”</bdi> : (categoryName ?? typeTitle)}</h1>
        <p className="text-sm text-muted">{plural(dict.catalog.productCount, result?.totalCount ?? 0, locale)}</p>
      </header>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Switching type clears brand and category: both are listed per type. */}
        <nav aria-label={dict.catalog.productType} className={`${segmented} sm:w-fit`}>
          {([undefined, "Phone", "Accessory"] as const).map((value) => (
            <Link
              key={value ?? "all"}
              href={href({ type: value, brand: undefined, category: undefined })}
              scroll={false}
              aria-current={type === value ? "page" : undefined}
              className={segment}
            >
              {value === "Phone" ? dict.catalog.phones : value === "Accessory" ? dict.catalog.accessories : dict.catalog.allProducts}
            </Link>
          ))}
        </nav>
        <SortSelect label={dict.catalog.sort} value={sort} options={sortOptions} className="hidden lg:flex" />
        <div className="flex gap-2 lg:hidden">
          <FilterSheet state={filters} labels={filterLabels} />
          <SortSelect label={dict.catalog.sort} value={sort} options={sortOptions} className="flex flex-1" />
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:items-start lg:gap-10">
        <aside className={`${panel} hidden p-5 lg:sticky lg:top-28 lg:block lg:max-h-[calc(100dvh-8rem)] lg:overflow-y-auto`}>
          <FilterPanel state={filters} labels={filterLabels} />
        </aside>

        <div className="flex min-w-0 flex-col gap-6">
          {applied.length > 0 && (
            <section aria-label={dict.catalog.activeFilters}>
              <ul className={`-mx-4 flex items-center gap-2 px-4 sm:mx-0 sm:flex-wrap sm:px-0 ${swipeRow}`}>
                {applied.map((filter) => (
                  <li key={filter.key} className="shrink-0">
                    <Link href={filter.href} scroll={false} aria-label={t(dict.catalog.removeFilter, { name: filter.name })} className={chipRemovable}>
                      {filter.label}
                      <CloseIcon />
                    </Link>
                  </li>
                ))}
                <li className="shrink-0">
                  <Link href={clearHref} scroll={false} className={`${buttonGhost} h-9 pointer-coarse:h-11`}>
                    {dict.catalog.clearAll}
                  </Link>
                </li>
              </ul>
            </section>
          )}

          {items.length > 0 ? (
            <ProductGrid products={items} locale={locale} currency={currency} dict={dict.catalog} layout="sidebar" preloadFirstRow />
          ) : (
            <div className="flex flex-col items-center gap-4 rounded-panel border border-border bg-surface px-6 py-14 text-center">
              <ProductArt type={type ?? "Phone"} colors={[]} className="h-36 w-auto opacity-50" />
              <h2 className={panelTitle}>{dict.catalog.noResults}</h2>
              <p className="max-w-sm text-sm text-muted">{dict.catalog.noResultsHint}</p>
              <div className="mt-2 flex flex-wrap justify-center gap-3">
                {applied.length > 0 && (
                  <Link href={clearHref} className={buttonPrimary}>
                    {dict.catalog.clearAll}
                  </Link>
                )}
                <Link href={`/${locale}/products`} className={buttonSecondary}>
                  {dict.catalog.allProducts}
                </Link>
              </div>
            </div>
          )}

          {result && result.totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={result.totalPages}
              totalCount={result.totalCount}
              pageSize={result.pageSize}
              href={(p) => href({ page: p > 1 ? p : undefined })}
              labels={dict.catalog}
            />
          )}
        </div>
      </div>
    </div>
  );
}
