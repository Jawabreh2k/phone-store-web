import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AdminFilterSelect } from "@/components/admin-filter-select";
import { HeadphonesIcon, PhoneIcon, PlusIcon, SearchIcon, StarIcon } from "@/components/icons";
import { LocalDateTime } from "@/components/local-date-time";
import { Pagination } from "@/components/pagination";
import { StatePanel } from "@/components/state-panel";
import {
  badgeAccent,
  badgeMuted,
  badgeSuccess,
  buttonPrimary,
  buttonSecondary,
  chipActive,
  chipIdle,
  fieldInput,
  pageTitle,
  panel,
  segment,
  segmented,
} from "@/components/ui";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { handleAdminReadError } from "@/lib/admin-auth";
import {
  adminProductsListHref,
  adminProductsListQuery,
  localized,
  parseAdminProductsListParams,
  productStatusFilters,
  type AdminProductsListParams,
} from "@/lib/admin-products";
import { adminApi, api } from "@/lib/api/server";
import type { AdminProductListItem } from "@/lib/api/types";
import { formatPrice, plural } from "@/lib/format";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: dict.admin.products.title };
}

export default async function AdminProductsPage({ searchParams }: PageProps<"/[lang]/admin/products">) {
  const [locale, dict, params] = await Promise.all([getLocale(), getDictionary(), searchParams]);
  const labels = dict.admin.products;
  const filters = parseAdminProductsListParams(params);
  const { search, type, brand, status, page = 1 } = filters;

  let result, brands;
  try {
    [result, brands] = await Promise.all([
      adminApi.products(locale, {
        search,
        type,
        brandId: brand,
        published: status === "published" ? true : status === "draft" ? false : undefined,
        lowStockOnly: status === "lowStock" || undefined,
        page,
        pageSize: 24,
      }),
      adminApi.brands(locale),
    ]);
  } catch (error) {
    handleAdminReadError(error, locale);
  }
  const currency = (await api.settings(locale))?.currencyCode ?? "JOD";

  /** The list URL with some filters changed; any change goes back to page 1. */
  const href = (changes: Partial<AdminProductsListParams>) => adminProductsListHref(locale, { ...filters, page: undefined, ...changes });
  const listQuery = adminProductsListQuery(filters);
  const filtered = Boolean(search || type || brand || status);

  const statusLabel = { published: labels.statusPublished, draft: labels.statusDraft, lowStock: labels.statusLowStock } as const;
  const editHref = (product: AdminProductListItem) => `/${locale}/admin/products/${product.id}${listQuery}`;
  const price = (product: AdminProductListItem) => (product.minPrice === null ? "—" : formatPrice(product.minPrice, currency, locale));

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className={pageTitle}>{labels.title}</h1>
          <p className="text-sm text-muted">{plural(labels.count, result.totalCount, locale)}</p>
        </div>
        <Link href={`/${locale}/admin/products/new`} className={buttonPrimary}>
          <PlusIcon />
          {labels.newProduct}
        </Link>
      </header>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <nav aria-label={labels.typeFilter} className={`${segmented} w-full sm:w-fit`}>
            <Link href={href({ type: undefined })} aria-current={!type ? "page" : undefined} className={segment}>
              {labels.typeAll}
            </Link>
            <Link href={href({ type: "Phone" })} aria-current={type === "Phone" ? "page" : undefined} className={segment}>
              {labels.typePhones}
            </Link>
            <Link href={href({ type: "Accessory" })} aria-current={type === "Accessory" ? "page" : undefined} className={segment}>
              {labels.typeAccessories}
            </Link>
          </nav>

          <form action={`/${locale}/admin/products`} method="get" role="search" className="flex flex-1 flex-col gap-2 sm:flex-row">
            {type && <input type="hidden" name="type" value={type} />}
            {status && <input type="hidden" name="status" value={status} />}
            <div className="relative flex-1">
              <label htmlFor="admin-products-search" className="sr-only">
                {labels.search}
              </label>
              <SearchIcon className="pointer-events-none absolute start-4 top-1/2 size-4 -translate-y-1/2 text-muted" />
              <input id="admin-products-search" name="search" type="search" defaultValue={search ?? ""} placeholder={labels.search} className={`${fieldInput} bg-surface ps-11`} />
            </div>
            <div className="sm:w-52">
              <AdminFilterSelect
                name="brand"
                label={labels.brandFilter}
                defaultValue={brand ?? ""}
                options={[{ value: "", label: labels.brandAll }, ...brands.map((b) => ({ value: b.id, label: b.name }))]}
              />
            </div>
            <button type="submit" className={`${buttonSecondary} h-auto min-h-11`}>
              {labels.searchSubmit}
            </button>
          </form>
        </div>

        <nav aria-label={labels.statusFilter} className="flex flex-wrap gap-2">
          <Link href={href({ status: undefined })} aria-current={!status ? "page" : undefined} className={!status ? chipActive : chipIdle}>
            {labels.statusAll}
          </Link>
          {productStatusFilters.map((value) => (
            <Link key={value} href={href({ status: value })} aria-current={status === value ? "page" : undefined} className={status === value ? chipActive : chipIdle}>
              {statusLabel[value]}
            </Link>
          ))}
        </nav>
      </div>

      {result.items.length === 0 ? (
        filtered ? (
          <StatePanel as="h2" visual={<SearchIcon className="size-10" />} title={labels.emptyTitle} body={labels.emptyBody}>
            <Link href={`/${locale}/admin/products`} className={buttonSecondary}>
              {labels.clearFilters}
            </Link>
          </StatePanel>
        ) : (
          <StatePanel as="h2" visual={<PhoneIcon className="size-10" />} title={labels.firstTitle} body={labels.firstBody}>
            <Link href={`/${locale}/admin/products/new`} className={buttonPrimary}>
              <PlusIcon />
              {labels.newProduct}
            </Link>
          </StatePanel>
        )
      ) : (
        <>
          <div className={`${panel} overflow-hidden`}>
            <table className="hidden w-full text-sm xl:table">
              <thead>
                <tr className="border-b border-border text-start text-xs text-muted">
                  <th scope="col" className="px-5 py-3 text-start font-medium">
                    {labels.columnProduct}
                  </th>
                  <th scope="col" className="px-4 py-3 text-start font-medium">
                    {labels.columnPrice}
                  </th>
                  <th scope="col" className="px-4 py-3 text-start font-medium">
                    {labels.columnStock}
                  </th>
                  <th scope="col" className="px-4 py-3 text-start font-medium">
                    {labels.columnStatus}
                  </th>
                  <th scope="col" className="px-5 py-3 text-start font-medium">
                    {labels.columnUpdated}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {result.items.map((product) => (
                  <tr key={product.id} className="group transition-colors hover:bg-foreground/[0.02]">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3.5">
                        <Thumbnail product={product} />
                        <div className="flex min-w-0 flex-col gap-0.5">
                          <Link href={editHref(product)} className="truncate font-semibold hover:text-brand hover:underline">
                            {localized(product.name, locale)}
                          </Link>
                          <span className="truncate text-xs text-muted">
                            {product.brandName} · {product.type === "Phone" ? labels.typePhone : labels.typeAccessory} ·{" "}
                            {product.variantCount === 0 ? labels.noOptions : plural(labels.optionCount, product.variantCount, locale)}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium tabular-nums">
                      <bdi>{price(product)}</bdi>
                    </td>
                    <td className="px-4 py-3">
                      <Stock product={product} labels={labels} />
                    </td>
                    <td className="px-4 py-3">
                      <Status product={product} labels={labels} />
                    </td>
                    <td className="px-5 py-3 text-xs text-muted">{product.updatedAt && <LocalDateTime iso={product.updatedAt} locale={locale} />}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <ul className="flex flex-col divide-y divide-border xl:hidden">
              {result.items.map((product) => (
                <li key={product.id}>
                  <Link href={editHref(product)} className="flex gap-4 px-4 py-4 transition-colors hover:bg-foreground/[0.02] sm:px-5">
                    <Thumbnail product={product} />
                    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                      <div className="flex items-start justify-between gap-3">
                        <span className="min-w-0 font-semibold">{localized(product.name, locale)}</span>
                        <bdi className="shrink-0 font-semibold tabular-nums">{price(product)}</bdi>
                      </div>
                      <span className="text-xs text-muted">
                        {product.brandName} · {product.variantCount === 0 ? labels.noOptions : plural(labels.optionCount, product.variantCount, locale)}
                      </span>
                      <div className="flex flex-wrap items-center gap-2 pt-0.5">
                        <Status product={product} labels={labels} />
                        <Stock product={product} labels={labels} />
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {(result.totalPages > 1 || page > 1) && (
            <Pagination
              page={result.page}
              totalPages={result.totalPages}
              totalCount={result.totalCount}
              pageSize={result.pageSize}
              href={(p) => adminProductsListHref(locale, { ...filters, page: p })}
              labels={dict.catalog}
            />
          )}
        </>
      )}
    </div>
  );
}

type ListLabels = Awaited<ReturnType<typeof getDictionary>>["admin"]["products"];

function Thumbnail({ product }: { product: AdminProductListItem }) {
  return (
    <span aria-hidden className="relative inline-flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-background text-muted/50">
      {product.imageUrl ? (
        <Image src={product.imageUrl} alt="" fill sizes="3.5rem" className="object-contain p-1" />
      ) : product.type === "Phone" ? (
        <PhoneIcon className="size-5" />
      ) : (
        <HeadphonesIcon className="size-5" />
      )}
    </span>
  );
}

function Status({ product, labels }: { product: AdminProductListItem; labels: ListLabels }) {
  return (
    <span className="flex flex-wrap items-center gap-1.5">
      <span className={product.isPublished ? badgeSuccess : badgeMuted}>{product.isPublished ? labels.published : labels.draft}</span>
      {product.isFeatured && (
        <span title={labels.featured} className="inline-flex size-6 items-center justify-center rounded-full bg-brand/5 text-brand">
          <StarIcon className="size-3" />
          <span className="sr-only">{labels.featured}</span>
        </span>
      )}
    </span>
  );
}

function Stock({ product, labels }: { product: AdminProductListItem; labels: ListLabels }) {
  if (product.variantCount === 0) return <span className="text-xs text-muted">—</span>;
  const alert = product.totalStock === 0 ? labels.outOfStock : product.hasLowStock ? labels.lowStock : null;
  return (
    <span className="flex flex-wrap items-center gap-2">
      <span className="font-medium tabular-nums">{product.totalStock.toLocaleString("en")}</span>
      {alert && <span className={badgeAccent}>{alert}</span>}
    </span>
  );
}
