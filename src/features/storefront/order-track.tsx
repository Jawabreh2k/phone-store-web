import Image from "next/image";
import { TrackingLink } from "@/features/storefront/tracking-link";
import { AlertIcon, CashIcon, CheckIcon } from "@/components/ui/icons";
import { LocalDateTime } from "@/components/ui/local-date-time";
import { ProductImagePlaceholder } from "@/components/ui/product-image-placeholder";
import { VariantLabel } from "@/components/ui/variant-label";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import type { OrderDetailsDto, OrderStatus } from "@/lib/api/types";
import { formatPrice, t } from "@/lib/format";
import { orderStatusLabel, paymentStatusLabel } from "@/lib/order-labels";
import { brandSurface, notice, pageTitle, panel, panelTitle } from "@/components/ui/ui";

interface Props {
  locale: Locale;
  order: OrderDetailsDto;
  /** Path of this page, without a host or the one-time `placed` query. */
  trackingPath: string;
  placed: boolean;
  labels: Dictionary["track"];
  confirmation: Dictionary["confirmation"];
  cashOnDeliveryLabel: string;
}

/** The normal path of an order; Cancelled can happen at any point and is shown on its own. */
const steps: OrderStatus[] = ["Pending", "Confirmed", "Shipped", "Delivered"];

function formatAddress(address: OrderDetailsDto["shippingAddress"]): string {
  const parts = [address.street, address.building, address.area, address.city, address.details].filter(Boolean);
  return parts.join(", ");
}

/**
 * A guest order as seen through its tracking link. The page fetches it; this only renders it. Right after
 * checkout (placed) it opens on the confirmation, on indigo like the hero, with the one-time tracking link.
 */
export function OrderTrack({ locale, order, trackingPath, placed, labels, confirmation, cashOnDeliveryLabel }: Props) {
  const money = (amount: number) => formatPrice(amount, order.currencyCode, locale);
  const cancelled = order.status === "Cancelled";
  const returned = order.status === "Returned";
  const terminal = cancelled || returned;
  const current = steps.indexOf(order.status);
  // The latest history entry for a status: when the order reached it, and any note from the shop.
  const reached = (status: OrderStatus) => order.history.filter((entry) => entry.status === status).at(-1);

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      {placed ? (
        <section className={`${brandSurface} relative isolate overflow-hidden rounded-panel px-5 py-8 sm:px-10 sm:py-12`}>
          <div aria-hidden className="bg-grid mask-fade-b pointer-events-none absolute inset-0 -z-10" />
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
            <div className="flex flex-col gap-5">
              <span className="inline-flex size-14 items-center justify-center rounded-full bg-success">
                <CheckIcon className="size-7" />
              </span>
              <h1 className="text-[2.25rem] leading-[1.1] font-semibold tracking-tight sm:text-5xl">{confirmation.orderPlaced}</h1>
              <dl className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
                <div>
                  <dt className="text-brand-foreground/70">{confirmation.orderNumber}</dt>
                  <dd className="text-lg font-semibold tabular-nums">
                    <bdi>{order.orderNumber}</bdi>
                  </dd>
                </div>
                <div>
                  <dt className="text-brand-foreground/70">{confirmation.total}</dt>
                  <dd className="text-lg font-semibold tabular-nums">
                    <bdi>{money(order.total)}</bdi>
                  </dd>
                </div>
                <div>
                  <dt className="text-brand-foreground/70">{labels.payment}</dt>
                  <dd className="text-lg font-semibold">{cashOnDeliveryLabel}</dd>
                </div>
              </dl>
            </div>

            {/* The only time the link is shown: a white card that floats on the band, like the hero's cards. */}
            <div className="w-full rounded-card bg-surface p-4 text-foreground shadow-float [--focus-ring:var(--brand)] sm:p-5 lg:max-w-lg">
              <p className="flex items-start gap-2.5 text-sm font-semibold">
                <AlertIcon className="mt-0.5 size-4 shrink-0 text-accent" />
                {confirmation.saveLinkWarning}
              </p>
              <TrackingLink path={trackingPath} copyLabel={confirmation.copyLink} copiedLabel={confirmation.copied} />
            </div>
          </div>
        </section>
      ) : (
        <header className="flex flex-col gap-2">
          <h1 className={pageTitle}>{labels.title}</h1>
          <p className="flex flex-wrap gap-x-2 text-sm text-muted">
            <span>
              {labels.orderNumber} <bdi className="font-semibold text-foreground">{order.orderNumber}</bdi>
            </span>
            <span aria-hidden>·</span>
            <LocalDateTime iso={order.placedAt} locale={locale} />
          </p>
        </header>
      )}

      <section aria-labelledby="order-progress" className={`${panel} p-5 sm:p-7`}>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h2 id="order-progress" className={panelTitle}>
            {labels.timeline}
          </h2>
          <span className={`rounded-full px-3 py-1 text-sm font-semibold ${terminal ? "bg-accent text-brand-foreground" : "bg-brand/5 text-brand"}`}>
            {orderStatusLabel(order.status, labels)}
          </span>
        </div>

        {terminal ? (
          <div className="flex flex-col gap-5">
            <p className={notice}>
              <AlertIcon />
              <span>
                {returned ? labels.returnedNotice : labels.cancelledNotice}
                {!returned && order.cancellationReason && <> {t(labels.cancelReason, { reason: order.cancellationReason })}</>}
              </span>
            </p>
            <ol className="flex flex-col gap-3">
              {order.history.map((entry) => (
                <li key={`${entry.status}-${entry.occurredAt}`} className="flex flex-wrap items-baseline justify-between gap-x-4 text-sm">
                  <span className="font-medium">{orderStatusLabel(entry.status, labels)}</span>
                  <span className="text-muted">
                    <LocalDateTime iso={entry.occurredAt} locale={locale} />
                  </span>
                  {entry.note && <span className="w-full text-muted">{entry.note}</span>}
                </li>
              ))}
            </ol>
          </div>
        ) : (
          // Vertical on phones, across the card from sm up; reached steps are indigo, the current one ringed.
          <ol className="grid sm:grid-cols-4">
            {steps.map((status, i) => {
              const done = i <= current;
              const now = i === current;
              const entry = reached(status);
              return (
                <li key={status} aria-current={now ? "step" : undefined} className="relative flex gap-4 pb-7 last:pb-0 sm:flex-col sm:gap-3 sm:pb-0">
                  {i < steps.length - 1 && (
                    <span
                      aria-hidden
                      className={`absolute start-[0.9375rem] top-8 bottom-0 w-0.5 sm:start-8 sm:end-0 sm:top-[0.9375rem] sm:bottom-auto sm:h-0.5 sm:w-auto ${i < current ? "bg-brand" : "bg-border"}`}
                    />
                  )}
                  <span
                    className={`relative inline-flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                      done ? "bg-brand text-brand-foreground" : "border-2 border-border bg-surface text-muted"
                    } ${now ? "ring-4 ring-brand/15" : ""}`}
                  >
                    {done && !now ? <CheckIcon /> : i + 1}
                  </span>
                  <div className="flex min-w-0 flex-col gap-0.5 pt-1 sm:pt-0 sm:pe-4">
                    <p className={`text-sm ${done ? "font-semibold" : "text-muted"}`}>{orderStatusLabel(status, labels)}</p>
                    {entry && (
                      <p className="text-xs text-muted">
                        <LocalDateTime iso={entry.occurredAt} locale={locale} />
                      </p>
                    )}
                    {entry?.note && <p className="text-xs text-muted">{entry.note}</p>}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:items-start lg:gap-12">
        <section aria-labelledby="order-items" className={`${panel} p-5 sm:p-7`}>
          <h2 id="order-items" className={panelTitle}>
            {labels.items}
          </h2>
          <ul className="mt-2 flex flex-col divide-y divide-border">
            {order.items.map((item) => (
              <li key={item.variantId} className="flex gap-4 py-4">
                <div className="relative aspect-square w-16 shrink-0 overflow-hidden rounded-xl bg-background">
                  {item.imageUrl ? (
                    <Image src={item.imageUrl} alt={item.productName} fill sizes="4rem" className="object-contain p-1" />
                  ) : (
                    <ProductImagePlaceholder name={item.productName} />
                  )}
                </div>
                <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium">{item.productName}</p>
                    <p className="text-sm text-muted">
                      <VariantLabel label={item.variantLabel} /> × {item.quantity}
                    </p>
                  </div>
                  <bdi className="shrink-0 text-sm font-semibold tabular-nums">{money(item.lineTotal)}</bdi>
                </div>
              </li>
            ))}
          </ul>
          <dl className="flex flex-col gap-3 border-t border-border pt-4 text-sm">
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-muted">{labels.subtotal}</dt>
              <dd className="font-medium tabular-nums">
                <bdi>{money(order.subtotal)}</bdi>
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-muted">{labels.shipping}</dt>
              <dd className="font-medium tabular-nums">
                {order.shippingFee === 0 ? <span className="text-success">{labels.free}</span> : <bdi>{money(order.shippingFee)}</bdi>}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 border-t border-border pt-3 text-base">
              <dt className="font-semibold">{labels.total}</dt>
              <dd className="text-xl font-semibold tracking-tight tabular-nums">
                <bdi>{money(order.total)}</bdi>
              </dd>
            </div>
          </dl>
        </section>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-28">
          <section aria-labelledby="order-delivery" className={`${panel} p-5 sm:p-6`}>
            <h2 id="order-delivery" className={panelTitle}>
              {labels.shippingAddress}
            </h2>
            <address className="mt-3 flex flex-col gap-1 text-sm leading-relaxed not-italic">
              <span className="font-medium">{order.contact.fullName}</span>
              <bdi dir="ltr" className="w-fit text-muted">
                {order.contact.phone}
              </bdi>
              {order.contact.email && (
                <span dir="ltr" className="w-fit text-muted">
                  {order.contact.email}
                </span>
              )}
              <span className="mt-2">{formatAddress(order.shippingAddress)}</span>
            </address>
            {order.customerNote && <p className="mt-4 border-t border-border pt-4 text-sm text-muted">{order.customerNote}</p>}
          </section>

          <section aria-labelledby="order-payment" className={`${panel} flex items-center gap-4 p-5`}>
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-success text-brand-foreground">
              <CashIcon className="size-[1.125rem]" />
            </span>
            <div className="flex flex-col">
              <h2 id="order-payment" className="font-semibold">
                {labels.payment}
              </h2>
              <p className="text-sm text-muted">
                {cashOnDeliveryLabel} · {paymentStatusLabel(order.paymentStatus, labels)}
              </p>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
