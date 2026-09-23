import Image from "next/image";
import { CopyLinkButton } from "@/components/copy-link-button";
import { CheckIcon } from "@/components/icons";
import { LocalDateTime } from "@/components/local-date-time";
import { ProductImagePlaceholder } from "@/components/product-image-placeholder";
import { VariantLabel } from "@/components/variant-label";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import type { OrderDetailsDto } from "@/lib/api/types";
import { formatPrice } from "@/lib/format";
import { orderStatusLabel, paymentStatusLabel } from "@/lib/order-labels";

interface Props {
  locale: Locale;
  order: OrderDetailsDto;
  /** Absolute link to this page, shown once on the confirmation banner. */
  trackingUrl: string;
  placed: boolean;
  labels: Dictionary["track"];
  confirmation: Dictionary["confirmation"];
  cashOnDeliveryLabel: string;
}

function formatAddress(address: OrderDetailsDto["shippingAddress"]): string {
  const parts = [address.street, address.building, address.area, address.city, address.details].filter(Boolean);
  return parts.join(", ");
}

/** A guest order as seen through its tracking link. The page fetches it; this only renders it. */
export function OrderTrack({ locale, order, trackingUrl, placed, labels, confirmation, cashOnDeliveryLabel }: Props) {
  return (
    <div className="flex flex-col gap-8 sm:gap-10">
      {placed && (
        <div className="flex flex-col gap-5 rounded-[1.5rem] border border-brand/30 bg-brand/5 p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <span className="inline-flex size-10 items-center justify-center rounded-full bg-brand text-brand-foreground">
              <CheckIcon className="size-5" />
            </span>
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{confirmation.orderPlaced}</h2>
          </div>

          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted">{confirmation.orderNumber}</dt>
              <dd className="text-lg font-semibold tabular-nums">
                <bdi>{order.orderNumber}</bdi>
              </dd>
            </div>
            <div>
              <dt className="text-muted">{confirmation.total}</dt>
              <dd className="text-lg font-semibold tabular-nums">{formatPrice(order.total, order.currencyCode, locale)}</dd>
            </div>
          </dl>

          <div className="flex flex-col gap-3 rounded-2xl border border-accent/30 bg-accent/5 px-4 py-3">
            <p className="text-sm font-medium text-accent">{confirmation.saveLinkWarning}</p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <p className="min-w-0 flex-1 break-all rounded-xl bg-background px-3 py-2 text-sm" dir="ltr">
                {trackingUrl}
              </p>
              {trackingUrl && (
                <CopyLinkButton url={trackingUrl} copyLabel={confirmation.copyLink} copiedLabel={confirmation.copied} />
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:items-start lg:gap-16">
        <div className="flex flex-col gap-6">
          <section className="rounded-[1.5rem] border border-border bg-surface p-5 sm:p-6">
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-muted">{labels.orderNumber}</dt>
                <dd className="text-lg font-semibold tabular-nums">
                  <bdi>{order.orderNumber}</bdi>
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted">{labels.status}</dt>
                <dd className="text-lg font-semibold">{orderStatusLabel(order.status, labels)}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted">{labels.placedAt}</dt>
                <dd className="text-sm font-medium"><LocalDateTime iso={order.placedAt} locale={locale} /></dd>
              </div>
              <div>
                <dt className="text-sm text-muted">{labels.payment}</dt>
                <dd className="text-sm font-medium">
                  {cashOnDeliveryLabel}
                  {" · "}
                  {paymentStatusLabel(order.paymentStatus, labels)}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-[1.5rem] border border-border bg-surface p-5 sm:p-6">
            <h2 className="mb-4 text-lg font-semibold tracking-tight">{labels.timeline}</h2>
            <ol className="flex flex-col gap-4">
              {order.history.map((entry, index) => (
                <li key={`${entry.status}-${entry.occurredAt}`} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <span
                      className={`size-3 rounded-full ${index === order.history.length - 1 ? "bg-brand" : "bg-border"}`}
                      aria-hidden
                    />
                    {index < order.history.length - 1 && <span className="mt-1 w-px flex-1 bg-border" aria-hidden />}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-1 pb-2">
                    <p className="font-medium">{orderStatusLabel(entry.status, labels)}</p>
                    <p className="text-sm text-muted"><LocalDateTime iso={entry.occurredAt} locale={locale} /></p>
                    {entry.note && <p className="text-sm text-muted">{entry.note}</p>}
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="rounded-[1.5rem] border border-border bg-surface p-5 sm:p-6">
            <h2 className="mb-4 text-lg font-semibold tracking-tight">{labels.orderSummary}</h2>
            <ul className="flex flex-col gap-4">
              {order.items.map((item) => (
                <li key={item.variantId} className="flex gap-4">
                  <div className="relative aspect-square w-16 shrink-0 overflow-hidden rounded-xl bg-background">
                    {item.imageUrl ? (
                      <Image src={item.imageUrl} alt={item.productName} fill sizes="4rem" className="object-contain p-1" />
                    ) : (
                      <ProductImagePlaceholder name={item.productName} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{item.productName}</p>
                    <p className="text-sm text-muted">
                      <VariantLabel label={item.variantLabel} /> × {item.quantity}
                    </p>
                    <p className="text-sm font-medium tabular-nums">{formatPrice(item.lineTotal, order.currencyCode, locale)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="flex flex-col gap-6 lg:sticky lg:top-28">
          <section className="rounded-[1.5rem] border border-border bg-surface p-5 sm:p-6">
            <h2 className="mb-4 text-lg font-semibold tracking-tight">{labels.contact}</h2>
            <dl className="flex flex-col gap-2 text-sm">
              <div>
                <dt className="sr-only">{labels.contact}</dt>
                <dd>{order.contact.fullName}</dd>
              </div>
              <div>
                <dt className="sr-only">{labels.contact}</dt>
                <dd>
                  <bdi dir="ltr">{order.contact.phone}</bdi>
                </dd>
              </div>
              {order.contact.email && (
                <div>
                  <dt className="sr-only">{labels.contact}</dt>
                  <dd dir="ltr">{order.contact.email}</dd>
                </div>
              )}
            </dl>
          </section>

          <section className="rounded-[1.5rem] border border-border bg-surface p-5 sm:p-6">
            <h2 className="mb-4 text-lg font-semibold tracking-tight">{labels.shippingAddress}</h2>
            <p className="text-sm leading-relaxed">{formatAddress(order.shippingAddress)}</p>
            {order.customerNote && (
              <p className="mt-4 border-t border-border pt-4 text-sm text-muted">{order.customerNote}</p>
            )}
          </section>

          <section className="rounded-[1.5rem] border border-border bg-surface p-5 sm:p-6">
            <dl className="flex flex-col gap-3 text-sm">
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-muted">{labels.subtotal}</dt>
                <dd className="font-medium tabular-nums">{formatPrice(order.subtotal, order.currencyCode, locale)}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-muted">{labels.shipping}</dt>
                <dd className="font-medium tabular-nums">{formatPrice(order.shippingFee, order.currencyCode, locale)}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 border-t border-border pt-3 text-base">
                <dt className="font-semibold">{labels.total}</dt>
                <dd className="text-xl font-semibold tracking-tight tabular-nums">{formatPrice(order.total, order.currencyCode, locale)}</dd>
              </div>
            </dl>
          </section>
        </aside>
      </div>
    </div>
  );
}
