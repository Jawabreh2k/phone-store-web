import type { Metadata } from "next";
import Link from "next/link";
import { SearchIcon } from "@/components/icons";
import { LocalDateTime } from "@/components/local-date-time";
import { Pagination } from "@/components/pagination";
import { StatePanel } from "@/components/state-panel";
import { buttonPrimary, chipActive, chipIdle, fieldInput, pageTitle, panel } from "@/components/ui";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { handleAdminReadError } from "@/lib/admin-auth";
import { adminOrderStatuses, adminOrdersListHref, adminOrdersListQuery, parseAdminOrdersListParams } from "@/lib/admin-orders-list";
import { adminApi } from "@/lib/api/server";
import { formatPrice } from "@/lib/format";
import { orderStatusLabel } from "@/lib/order-labels";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: dict.admin.orders.title };
}

export default async function AdminOrdersPage({ searchParams }: PageProps<"/[lang]/admin/orders">) {
  const [locale, dict, params] = await Promise.all([getLocale(), getDictionary(), searchParams]);
  const labels = dict.admin.orders;
  const trackLabels = dict.track;

  const { status, search, page = 1 } = parseAdminOrdersListParams(params);

  let result;
  try {
    result = await adminApi.orders(locale, { status, search, page, pageSize: 24 });
  } catch (error) {
    handleAdminReadError(error, locale);
  }

  const current = { status, search, page: page > 1 ? page : undefined };
  const listQuery = adminOrdersListQuery(current);
  const href = (changes: Partial<{ status?: (typeof status) | ""; search?: string; page?: number }>) =>
    adminOrdersListHref(locale, { ...current, page: undefined, ...changes, status: changes.status === "" ? undefined : changes.status ?? current.status });

  const money = (amount: number, currency: string) => formatPrice(amount, currency, locale);
  const showPagination = result.totalPages > 1 || page > 1;
  const searchId = "admin-orders-search";

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <h1 className={pageTitle}>{labels.title}</h1>

      <form action={`/${locale}/admin/orders`} method="get" className="flex flex-col gap-3 sm:flex-row sm:items-end">
        {status && <input type="hidden" name="status" value={status} />}
        <div className="relative flex-1">
          <label htmlFor={searchId} className="sr-only">
            {labels.search}
          </label>
          <SearchIcon className="pointer-events-none absolute start-4 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            id={searchId}
            name="search"
            type="search"
            defaultValue={search ?? ""}
            placeholder={labels.search}
            className={`${fieldInput} ps-11`}
          />
        </div>
        <button type="submit" className={buttonPrimary}>
          {labels.searchSubmit}
        </button>
      </form>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-muted">{labels.statusFilter}</span>
        <div className="flex flex-wrap gap-2">
          <Link href={href({ status: "", page: 1 })} aria-current={!status ? "page" : undefined} className={!status ? chipActive : chipIdle}>
            {labels.statusAll}
          </Link>
          {adminOrderStatuses.map((value) => (
            <Link
              key={value}
              href={href({ status: value, page: 1 })}
              aria-current={status === value ? "page" : undefined}
              className={status === value ? chipActive : chipIdle}
            >
              {orderStatusLabel(value, trackLabels)}
            </Link>
          ))}
        </div>
      </div>

      {result.items.length === 0 ? (
        <StatePanel title={labels.emptyTitle} body={labels.emptyBody} visual={<SearchIcon className="size-10" />} as="h2" />
      ) : (
        <>
          <div className={`${panel} overflow-hidden`}>
            <table className="hidden w-full text-sm xl:table">
              <thead>
                <tr className="border-b border-border text-start text-xs font-medium text-muted">
                  <th scope="col" className="px-4 py-3 font-medium">
                    {labels.orderNumber}
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    {labels.status}
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    {labels.customer}
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    {labels.phone}
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    {labels.city}
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    {labels.items}
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    {labels.total}
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    {labels.placedAt}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {result.items.map((order) => (
                  <tr key={order.id} className="transition-colors hover:bg-foreground/[0.02]">
                    <td className="px-4 py-3">
                      <Link href={`/${locale}/admin/orders/${order.id}${listQuery}`} className="font-semibold text-brand hover:underline">
                        <bdi>{order.orderNumber}</bdi>
                      </Link>
                      <span className="ms-2 text-xs text-muted">{order.isGuest ? labels.guest : labels.account}</span>
                    </td>
                    <td className="px-4 py-3">{orderStatusLabel(order.status, trackLabels)}</td>
                    <td className="px-4 py-3">{order.customerName}</td>
                    <td className="px-4 py-3">
                      <bdi dir="ltr">{order.phone}</bdi>
                    </td>
                    <td className="px-4 py-3">{order.city}</td>
                    <td className="px-4 py-3 tabular-nums">{order.itemCount}</td>
                    <td className="px-4 py-3 font-medium tabular-nums">
                      <bdi>{money(order.total, order.currencyCode)}</bdi>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      <LocalDateTime iso={order.placedAt} locale={locale} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <ul className="flex flex-col divide-y divide-border xl:hidden">
              {result.items.map((order) => (
                <li key={order.id}>
                  <Link href={`/${locale}/admin/orders/${order.id}${listQuery}`} className="flex flex-col gap-2 px-4 py-4 transition-colors hover:bg-foreground/[0.02]">
                    <div className="flex items-start justify-between gap-3">
                      <span className="font-semibold text-brand">
                        <bdi>{order.orderNumber}</bdi>
                      </span>
                      <span className="text-xs text-muted">{order.isGuest ? labels.guest : labels.account}</span>
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted">
                      <span>{orderStatusLabel(order.status, trackLabels)}</span>
                      <span>{order.customerName}</span>
                      <bdi dir="ltr">{order.phone}</bdi>
                      <span>{order.city}</span>
                    </div>
                    <div className="flex items-baseline justify-between text-sm">
                      <span className="text-muted">
                        {labels.items}: {order.itemCount}
                      </span>
                      <bdi className="font-semibold tabular-nums">{money(order.total, order.currencyCode)}</bdi>
                    </div>
                    <span className="text-xs text-muted">
                      <LocalDateTime iso={order.placedAt} locale={locale} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {showPagination && (
            <Pagination
              page={result.page}
              totalPages={result.totalPages}
              totalCount={result.totalCount}
              pageSize={result.pageSize}
              href={(p) => href({ page: p })}
              labels={dict.catalog}
            />
          )}
        </>
      )}
    </div>
  );
}
