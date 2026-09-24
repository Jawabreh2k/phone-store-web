import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ArrowIcon, ListIcon } from "@/components/ui/icons";
import { LocalDateTime } from "@/components/ui/local-date-time";
import { Pagination } from "@/components/ui/pagination";
import { ProductImagePlaceholder } from "@/components/ui/product-image-placeholder";
import { StatePanel } from "@/components/ui/state-panel";
import { badgeBrand, badgeMuted, badgeSuccess, buttonPrimary, pageTitle, panel } from "@/components/ui/ui";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { accountApi } from "@/lib/api/server";
import type { OrderStatus } from "@/lib/api/types";
import { formatPrice, plural } from "@/lib/format";
import { orderStatusLabel } from "@/lib/order-labels";
import { authErrorFrom, signInPromptUrl } from "@/lib/sign-in-prompt";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: dict.account.ordersTitle, robots: { index: false, follow: false } };
}

const statusBadge: Record<OrderStatus, string> = {
  Pending: badgeBrand,
  Confirmed: badgeBrand,
  Shipped: badgeBrand,
  Delivered: badgeSuccess,
  Cancelled: badgeMuted,
  Returned: badgeMuted,
};

// No loading.tsx on purpose: the list is read before anything streams, so a signed-out visitor gets a real
// redirect (a streamed page is already committed to 200). Other API failures throw to the error boundary.
export default async function AccountOrdersPage({ searchParams }: PageProps<"/[lang]/account/orders">) {
  const [locale, dict, query] = await Promise.all([getLocale(), getDictionary(), searchParams]);
  const rawPage = Array.isArray(query.page) ? query.page[0] : query.page;
  const page = Math.max(1, Math.trunc(Number(rawPage)) || 1);
  const base = `/${locale}/account/orders`;
  const href = (p: number) => (p > 1 ? `${base}?page=${p}` : base);

  const result = await accountApi.orders(locale, page);
  if (!result.signedIn) redirect(signInPromptUrl(locale, href(page), authErrorFrom(query)));
  const orders = result.data;
  if (orders.items.length === 0 && page > 1) redirect(base);

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <header className="flex flex-col gap-3">
        <Breadcrumbs label={dict.catalog.breadcrumb} items={[{ label: dict.nav.home, href: `/${locale}` }, { label: dict.account.ordersTitle }]} />
        <h1 className={pageTitle}>{dict.account.ordersTitle}</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted">{dict.account.ordersSubtitle}</p>
      </header>

      {orders.items.length === 0 ? (
        <StatePanel as="h2" visual={<ListIcon className="size-10" />} title={dict.account.emptyTitle} body={dict.account.emptyBody}>
          <Link href={`/${locale}/products`} className={buttonPrimary}>
            {dict.account.browseProducts}
          </Link>
        </StatePanel>
      ) : (
        <ul className="flex flex-col gap-3">
          {orders.items.map((order) => (
            <li key={order.id}>
              <Link
                href={`${base}/${encodeURIComponent(order.orderNumber)}`}
                className={`${panel} group flex items-center gap-4 p-4 transition-colors hover:border-foreground/40 sm:gap-5 sm:p-5`}
              >
                <div aria-hidden className="relative aspect-square w-14 shrink-0 overflow-hidden rounded-xl bg-background sm:w-16">
                  {order.firstItemImageUrl ? (
                    <Image src={order.firstItemImageUrl} alt="" fill sizes="4rem" className="object-contain p-1" />
                  ) : (
                    <ProductImagePlaceholder name="" />
                  )}
                </div>

                <div className="flex min-w-0 flex-1 flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-6">
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <bdi className="truncate font-semibold tabular-nums">{order.orderNumber}</bdi>
                      <span className={statusBadge[order.status]}>{orderStatusLabel(order.status, dict.track)}</span>
                    </div>
                    <p className="flex flex-wrap gap-x-2 text-sm text-muted">
                      <LocalDateTime iso={order.placedAt} locale={locale} />
                      <span aria-hidden>·</span>
                      <span>{plural(dict.cart.itemCount, order.itemCount, locale)}</span>
                    </p>
                  </div>
                  <bdi className="shrink-0 font-semibold tabular-nums sm:text-lg">
                    {formatPrice(order.total, order.currencyCode, locale)}
                  </bdi>
                </div>

                <ArrowIcon className="size-4 shrink-0 text-muted transition-colors group-hover:text-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      )}

      {orders.totalPages > 1 && (
        <Pagination
          page={orders.page}
          totalPages={orders.totalPages}
          totalCount={orders.totalCount}
          pageSize={orders.pageSize}
          href={href}
          labels={dict.catalog}
        />
      )}
    </div>
  );
}
