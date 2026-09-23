import type { Metadata } from "next";
import Link from "next/link";
import { ArrowIcon } from "@/components/icons";
import { ProductGrid } from "@/components/product-grid";
import { buttonSecondary, chipActive, chipIdle, eyebrow, swipeRow } from "@/components/ui";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { api } from "@/lib/api/server";
import type { ProductSort, ProductType } from "@/lib/api/types";
import { t } from "@/lib/format";

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

export async function generateMetadata({ searchParams }: PageProps<"/[lang]/products">): Promise<Metadata> {
  const dict = await getDictionary();
  const type = pick(await searchParams, "type", productTypes);
  return { title: type === "Phone" ? dict.catalog.phones : type === "Accessory" ? dict.catalog.accessories : dict.catalog.allProducts };
}

export default async function ProductsPage({ searchParams }: PageProps<"/[lang]/products">) {
  const [locale, dict, params] = await Promise.all([getLocale(), getDictionary(), searchParams]);

  const type = pick(params, "type", productTypes);
  const brand = pick(params, "brand");
  const search = pick(params, "search");
  const sort = pick(params, "sort", sorts) ?? "Featured";
  const page = Math.max(1, Number(pick(params, "page")) || 1);

  const [settings, brands, result] = await Promise.all([
    api.settings(locale),
    api.brands(locale, type),
    api.products(locale, { type, brand, search, sort, page }),
  ]);

  const title = type === "Phone" ? dict.catalog.phones : type === "Accessory" ? dict.catalog.accessories : dict.catalog.allProducts;
  const href = (changes: Record<string, string | number | undefined>) => {
    const next = new URLSearchParams();
    const merged = { type, brand, search, sort: sort === "Featured" ? undefined : sort, page: undefined, ...changes };
    for (const [key, value] of Object.entries(merged)) if (value !== undefined && value !== "") next.set(key, String(value));
    const query = next.toString();
    return `/${locale}/products${query ? `?${query}` : ""}`;
  };

  const sortLabels: Record<ProductSort, string> = {
    Featured: dict.catalog.sortFeatured,
    Newest: dict.catalog.sortNewest,
    PriceAsc: dict.catalog.sortPriceAsc,
    PriceDesc: dict.catalog.sortPriceDesc,
    NameAsc: dict.catalog.sortFeatured,
  };

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-3 border-b border-border pb-6">
        <p className={eyebrow}>{t(dict.catalog.results, { count: result?.totalCount ?? 0 })}</p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{search ? <bdi>“{search}”</bdi> : title}</h1>
      </header>

      {/* Filters are plain links: they work without JavaScript and every filtered view has a shareable URL. */}
      <div className="flex flex-col gap-4">
        <FilterRow>
          {/* Switching type clears the brand: brands are listed per type. */}
          <Chip href={href({ type: undefined, brand: undefined })} active={!type}>{dict.catalog.allProducts}</Chip>
          <Chip href={href({ type: "Phone", brand: undefined })} active={type === "Phone"}>{dict.catalog.phones}</Chip>
          <Chip href={href({ type: "Accessory", brand: undefined })} active={type === "Accessory"}>{dict.catalog.accessories}</Chip>
        </FilterRow>
        <FilterRow label={dict.catalog.brand}>
          <Chip href={href({ brand: undefined })} active={!brand}>{dict.catalog.allBrands}</Chip>
          {(brands ?? []).map((b) => (
            <Chip key={b.id} href={href({ brand: b.slug })} active={brand === b.slug}>{b.name}</Chip>
          ))}
        </FilterRow>
        <FilterRow label={dict.catalog.sort}>
          {sorts.map((s) => (
            <Chip key={s} href={href({ sort: s === "Featured" ? undefined : s })} active={sort === s}>{sortLabels[s]}</Chip>
          ))}
        </FilterRow>
      </div>

      <ProductGrid
        products={result?.items ?? []}
        locale={locale}
        currency={settings?.currencyCode ?? "JOD"}
        dict={dict.catalog}
        preloadFirstRow
      />

      {result && result.totalPages > 1 && (
        <nav className="flex items-center justify-center gap-4 border-t border-border pt-8 text-sm">
          {page > 1 && (
            <Link href={href({ page: page - 1 })} className={buttonSecondary}>
              <ArrowIcon className="size-4 rotate-180" />
              {dict.catalog.previous}
            </Link>
          )}
          <span className="text-muted" dir="ltr">{page} / {result.totalPages}</span>
          {result.hasNextPage && (
            <Link href={href({ page: page + 1 })} className={buttonSecondary}>
              {dict.catalog.next}
              <ArrowIcon />
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}

function FilterRow({ label, children }: { label?: string; children: React.ReactNode }) {
  return (
    <div className={`-mx-4 flex items-center gap-2 px-4 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 ${swipeRow}`}>
      {label && <span className="me-2 shrink-0 text-sm text-muted">{label}</span>}
      {children}
    </div>
  );
}

function Chip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link href={href} scroll={false} aria-current={active ? "true" : undefined} className={active ? chipActive : chipIdle}>
      {children}
    </Link>
  );
}
