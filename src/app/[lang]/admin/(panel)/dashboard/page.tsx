import type { Metadata } from "next";
import type { ReactNode } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import Image from "next/image";
import Link from "next/link";
import { AdminDashboardChart } from "@/components/admin-dashboard-chart";
import { AdminDashboardRefresh } from "@/components/admin-dashboard-refresh";
import { ExternalIcon, PhoneIcon, PlusIcon } from "@/components/icons";
import { LocalDateTime } from "@/components/local-date-time";
import { StatePanel } from "@/components/state-panel";
import { VariantLabel } from "@/components/variant-label";
import { badgeAccent, badgeMuted, buttonPrimary, buttonSecondary, chipIdle, pageTitle, panel, panelTitle } from "@/components/ui";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { formatStoreDate, relativeAge, staffFirstName, waitHours } from "@/lib/admin-dashboard";
import { getAdminGate, handleAdminReadError } from "@/lib/admin-auth";
import { adminProductsListHref, localized } from "@/lib/admin-products";
import { adminApi } from "@/lib/api/server";
import type { AdminDashboard } from "@/lib/api/types";
import { formatPrice, plural, t } from "@/lib/format";
import { orderStatusLabel } from "@/lib/order-labels";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: dict.admin.dashboard.title };
}

export default async function AdminDashboardPage() {
  const [locale, dict] = await Promise.all([getLocale(), getDictionary()]);
  const gate = await getAdminGate(locale);
  const labels = dict.admin.dashboard;
  const trackLabels = dict.track;

  let data;
  try {
    data = await adminApi.dashboard(locale);
  } catch (error) {
    handleAdminReadError(error, locale);
  }

  const firstName = staffFirstName(gate.kind === "admin" ? gate.profile.fullName : "");
  const todayFormatted = formatStoreDate(data.today, locale);
  const isEmpty = data.recentOrders.length === 0;
  const hasAttention = data.lowStock.length > 0 || data.catalog.drafts > 0 || data.catalog.publishedWithoutPhotos > 0 || data.catalog.publishedOutOfStock > 0;

  const storeRevenue = (entries: typeof data.todaySummary.revenue) =>
    entries.find((entry) => entry.currencyCode === data.storeCurrencyCode)?.amount ?? 0;

  const ordersDelta = data.todaySummary.orders - data.todaySummary.yesterdayOrders;
  const deltaLabel =
    ordersDelta === 0
      ? labels.ordersDeltaSame
      : t(labels.ordersDelta, { delta: ordersDelta > 0 ? `+${ordersDelta}` : String(ordersDelta) });

  const chartDays = data.last14Days.map((day) => ({
    day: day.day,
    orders: day.orders,
    revenue: day.revenue,
    isToday: day.day === data.today,
  }));

  const money = (amount: number, currency: string) => formatPrice(amount, currency, locale);
  const yesterdayStoreSales = storeRevenue(data.todaySummary.yesterdayRevenue);

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <AdminDashboardRefresh />

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className={pageTitle}>{t(labels.greeting, { name: firstName })}</h1>
          <p className="text-sm text-muted">{t(labels.todayDate, { date: todayFormatted })}</p>
        </div>
        <Link href={`/${locale}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-brand">
          {labels.viewStore}
          <ExternalIcon className="size-4" />
        </Link>
      </header>

      {isEmpty && (
        <StatePanel visual={<PhoneIcon className="size-10" />} title={labels.emptyTitle} body={labels.emptyBody} as="h2">
          <Link href={`/${locale}/admin/products/new`} className={buttonPrimary}>
            <PlusIcon />
            {labels.emptyAddProducts}
          </Link>
          <Link href={`/${locale}`} target="_blank" rel="noopener noreferrer" className={buttonSecondary}>
            {labels.emptyShareStore}
            <ExternalIcon className="size-4" />
          </Link>
        </StatePanel>
      )}

      {!isEmpty && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiTile
              title={labels.ordersToday}
              value={String(data.todaySummary.orders)}
              hint={<span className="w-fit rounded-full bg-foreground/5 px-2.5 py-0.5 text-xs font-medium">{deltaLabel}</span>}
            />
            <KpiTile
              title={labels.salesToday}
              value={<bdi>{money(storeRevenue(data.todaySummary.revenue), data.storeCurrencyCode)}</bdi>}
              hint={
                <>
                  {data.todaySummary.revenue
                    .filter((entry) => entry.currencyCode !== data.storeCurrencyCode)
                    .map((entry) => (
                      <span key={entry.currencyCode} className="block text-xs text-muted">
                        <bdi>{money(entry.amount, entry.currencyCode)}</bdi>
                      </span>
                    ))}
                  {yesterdayStoreSales > 0 && (
                    <span className="block text-xs text-muted">{t(labels.yesterdaySales, { amount: money(yesterdayStoreSales, data.storeCurrencyCode) })}</span>
                  )}
                </>
              }
            />
            <KpiTile
              title={labels.waitingConfirmation}
              value={String(data.queue.pendingCount)}
              href={`/${locale}/admin/orders?status=Pending`}
              accent={data.queue.oldestPendingAt != null && waitHours(data.queue.oldestPendingAt) > 2}
              hint={
                data.queue.oldestPendingAt ? (
                  <span className="text-xs text-muted">{t(labels.oldestWaiting, { time: relativeAge(data.queue.oldestPendingAt, locale) })}</span>
                ) : null
              }
            />
            <KpiTile title={labels.readyToShip} value={String(data.queue.confirmedCount)} href={`/${locale}/admin/orders?status=Confirmed`} />
          </div>

          <div className={`grid gap-6 ${hasAttention ? "lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]" : ""}`}>
            <section className={`${panel} flex flex-col gap-4 p-5`}>
              <h2 className={panelTitle}>{labels.salesChart}</h2>
              <AdminDashboardChart locale={locale} currency={data.storeCurrencyCode} days={chartDays} labels={labels} />
            </section>

            {hasAttention && <NeedsAttention data={data} locale={locale} labels={labels} />}
          </div>

          <section className={`${panel} overflow-hidden`}>
            <h2 className={`${panelTitle} border-b border-border px-5 py-4`}>{labels.topSellers}</h2>
            {data.topSellers.length === 0 ? (
              <p className="px-5 py-6 text-sm text-muted">{labels.topSellersEmpty}</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-start text-xs font-medium text-muted">
                    <th scope="col" className="px-5 py-3 text-start font-medium">
                      #
                    </th>
                    <th scope="col" className="px-5 py-3 text-start font-medium">
                      {labels.productColumn}
                    </th>
                    <th scope="col" className="px-5 py-3 text-start font-medium">
                      {labels.unitsSold}
                    </th>
                    <th scope="col" className="px-5 py-3 text-start font-medium">
                      {labels.salesColumn}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.topSellers.map((item, index) => (
                    <tr key={item.productId}>
                      <td className="px-5 py-3 tabular-nums text-muted">{index + 1}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <Thumb url={item.imageUrl} />
                          <span className="font-medium">{localized(item.productName, locale)}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 tabular-nums">{item.units}</td>
                      <td className="px-5 py-3 font-medium tabular-nums">
                        <bdi>{money(item.revenue, data.storeCurrencyCode)}</bdi>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section className={`${panel} overflow-hidden`}>
            <h2 className={`${panelTitle} border-b border-border px-5 py-4`}>{labels.recentOrders}</h2>
            <ul className="flex flex-col divide-y divide-border">
              {data.recentOrders.map((order) => (
                <li key={order.id}>
                  <Link href={`/${locale}/admin/orders/${order.id}`} className="flex flex-col gap-2 px-5 py-4 transition-colors hover:bg-foreground/[0.02] sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="font-semibold text-brand">
                        <bdi>{order.orderNumber}</bdi>
                      </span>
                      <span>{orderStatusLabel(order.status, trackLabels)}</span>
                      <span>{order.customerName}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                      <bdi className="font-semibold tabular-nums">{money(order.total, order.currencyCode)}</bdi>
                      <span className="text-muted">
                        <LocalDateTime iso={order.placedAt} locale={locale} />
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}

      {isEmpty && hasAttention && <NeedsAttention data={data} locale={locale} labels={labels} />}
    </div>
  );
}

function NeedsAttention({ data, locale, labels }: { data: AdminDashboard; locale: Locale; labels: Dictionary["admin"]["dashboard"] }) {
  return (
    <section className={`${panel} flex flex-col gap-5 p-5`}>
      <h2 className={panelTitle}>{labels.needsAttention}</h2>

      {data.lowStock.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold">{labels.lowStock}</h3>
            <Link href={adminProductsListHref(locale, { status: "lowStock" })} className="text-sm font-medium text-brand hover:underline">
              {labels.viewAllLowStock}
            </Link>
          </div>
          <ul className="flex flex-col divide-y divide-border">
            {data.lowStock.map((item) => (
              <li key={item.variantId}>
                <Link href={`/${locale}/admin/products/${item.productId}#variants`} className="flex items-center gap-3 py-3 transition-colors hover:bg-foreground/[0.02]">
                  <Thumb url={item.imageUrl} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{localized(item.productName, locale)}</span>
                    <span className="block truncate text-sm text-muted">
                      <VariantLabel label={localized(item.variantDescription, locale)} />
                    </span>
                    <bdi className="mt-1 block text-xs text-muted">{item.sku}</bdi>
                  </span>
                  <span className={item.stockQuantity === 0 ? badgeAccent : badgeMuted}>
                    {item.stockQuantity === 0 ? labels.outOfStock : plural(labels.leftCount, item.stockQuantity, locale)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold">{labels.catalogHealth}</h3>
        <div className="flex flex-wrap gap-2">
          {data.catalog.drafts > 0 && (
            <Link href={adminProductsListHref(locale, { status: "draft" })} className={chipIdle}>
              {labels.drafts} · {data.catalog.drafts}
            </Link>
          )}
          {data.catalog.publishedWithoutPhotos > 0 && (
            <Link href={adminProductsListHref(locale, { status: "noPhotos" })} className={chipIdle}>
              {labels.publishedNoPhotos} · {data.catalog.publishedWithoutPhotos}
            </Link>
          )}
          {data.catalog.publishedOutOfStock > 0 && (
            <Link href={adminProductsListHref(locale, { status: "outOfStock" })} className={chipIdle}>
              {labels.publishedOutOfStock} · {data.catalog.publishedOutOfStock}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

function KpiTile({
  title,
  value,
  hint,
  href,
  accent,
}: {
  title: string;
  value: ReactNode;
  hint?: ReactNode;
  href?: string;
  accent?: boolean;
}) {
  const body = (
    <>
      <span className="text-sm font-medium text-muted">{title}</span>
      <span className={`text-3xl font-semibold tabular-nums tracking-tight ${accent ? "text-accent" : ""}`}>{value}</span>
      {hint}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={`${panel} flex flex-col gap-2 p-5 transition-colors hover:bg-foreground/[0.02] ${accent ? "ring-1 ring-accent/30" : ""}`}>
        {body}
      </Link>
    );
  }

  return <div className={`${panel} flex flex-col gap-2 p-5`}>{body}</div>;
}

function Thumb({ url }: { url: string | null }) {
  return (
    <span aria-hidden className="relative inline-flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-background text-muted/50">
      {url ? <Image src={url} alt="" fill sizes="3rem" className="object-contain p-1" /> : <PhoneIcon className="size-4" />}
    </span>
  );
}
