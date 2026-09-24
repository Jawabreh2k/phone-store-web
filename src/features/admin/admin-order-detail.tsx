import Image from "next/image";
import Link from "next/link";
import { AdminOrderActions } from "@/features/admin/admin-order-actions";
import { AdminOrderMessages } from "@/features/admin/admin-order-messages";
import { BackArrowIcon, CashIcon } from "@/components/ui/icons";
import { LocalDateTime } from "@/components/ui/local-date-time";
import { ProductImagePlaceholder } from "@/components/ui/product-image-placeholder";
import { VariantLabel } from "@/components/ui/variant-label";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import type { AdminNotification, AdminOrderDetails, OrderDetailsDto } from "@/lib/api/types";
import { formatPrice } from "@/lib/format";
import { orderStatusLabel, paymentStatusLabel } from "@/lib/order-labels";
import { buttonSecondary, pageTitle, panel, panelTitle, textLink } from "@/components/ui/ui";

interface Props {
  locale: Locale;
  backHref: string;
  details: AdminOrderDetails;
  /** Null when the message list could not be loaded. */
  messages: AdminNotification[] | null;
  labels: Dictionary["admin"]["orders"];
  trackLabels: Dictionary["track"];
  cashOnDeliveryLabel: string;
  loadingLabel: string;
  closeLabel: string;
}

function formatAddress(address: OrderDetailsDto["shippingAddress"]): string {
  const parts = [address.street, address.building, address.area, address.city, address.details].filter(Boolean);
  return parts.join(", ");
}

export function AdminOrderDetail({ locale, backHref, details, messages, labels, trackLabels, cashOnDeliveryLabel, loadingLabel, closeLabel }: Props) {
  const { order, history, nextStatuses } = details;
  const money = (amount: number) => formatPrice(amount, order.currencyCode, locale);
  const whatsAppDigits = order.contact.phone.replace(/\D/g, "");

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <header className="flex flex-col gap-3">
        <Link href={backHref} className={`${buttonSecondary} w-fit`}>
          <BackArrowIcon />
          {labels.backToList}
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h1 className={pageTitle}>
              {labels.detailTitlePrefix} <bdi>{order.orderNumber}</bdi>
            </h1>
            <p className="text-sm text-muted">
              <LocalDateTime iso={order.placedAt} locale={locale} />
            </p>
          </div>
          <span className="rounded-full bg-brand/5 px-3 py-1 text-sm font-semibold text-brand">
            {orderStatusLabel(order.status, trackLabels)}
          </span>
        </div>
      </header>

      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:items-start lg:gap-12">
        <div className="flex flex-col gap-6">
          <section aria-labelledby="admin-order-items" className={`${panel} p-5 sm:p-7`}>
            <h2 id="admin-order-items" className={panelTitle}>
              {trackLabels.items}
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
                <dt className="text-muted">{trackLabels.subtotal}</dt>
                <dd className="font-medium tabular-nums">
                  <bdi>{money(order.subtotal)}</bdi>
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-muted">{trackLabels.shipping}</dt>
                <dd className="font-medium tabular-nums">
                  {order.shippingFee === 0 ? <span className="text-success">{trackLabels.free}</span> : <bdi>{money(order.shippingFee)}</bdi>}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 border-t border-border pt-3 text-base">
                <dt className="font-semibold">{trackLabels.total}</dt>
                <dd className="text-xl font-semibold tracking-tight tabular-nums">
                  <bdi>{money(order.total)}</bdi>
                </dd>
              </div>
            </dl>
          </section>

          <section aria-labelledby="admin-order-history" className={`${panel} p-5 sm:p-7`}>
            <h2 id="admin-order-history" className={panelTitle}>
              {labels.history}
            </h2>
            <ol className="mt-4 flex flex-col gap-3">
              {history.map((entry) => (
                <li key={`${entry.status}-${entry.occurredAt}`} className="flex flex-wrap items-baseline justify-between gap-x-4 text-sm">
                  <span className="font-medium">{orderStatusLabel(entry.status, trackLabels)}</span>
                  <span className="text-muted">
                    <LocalDateTime iso={entry.occurredAt} locale={locale} />
                  </span>
                  {entry.note && <span className="w-full text-muted">{entry.note}</span>}
                </li>
              ))}
            </ol>
          </section>

          <AdminOrderActions locale={locale} orderId={order.id} nextStatuses={nextStatuses} labels={labels} loadingLabel={loadingLabel} />

          <AdminOrderMessages locale={locale} messages={messages} labels={labels.messages} closeLabel={closeLabel} />
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-8">
          <section aria-labelledby="admin-order-contact" className={`${panel} p-5 sm:p-6`}>
            <h2 id="admin-order-contact" className={panelTitle}>
              {labels.contact}
            </h2>
            <address className="mt-3 flex flex-col gap-1 text-sm leading-relaxed not-italic">
              <span className="font-medium">{order.contact.fullName}</span>
              <bdi dir="ltr" className="w-fit">
                <a href={`tel:${order.contact.phone}`} className={textLink}>
                  {order.contact.phone}
                </a>
              </bdi>
              {whatsAppDigits && (
                <bdi dir="ltr" className="w-fit">
                  <a href={`https://wa.me/${whatsAppDigits}`} target="_blank" rel="noopener noreferrer" className={textLink}>
                    {labels.whatsapp}
                  </a>
                </bdi>
              )}
              {order.contact.email && (
                <span dir="ltr" className="w-fit text-muted">
                  {order.contact.email}
                </span>
              )}
            </address>
          </section>

          <section aria-labelledby="admin-order-address" className={`${panel} p-5 sm:p-6`}>
            <h2 id="admin-order-address" className={panelTitle}>
              {labels.shippingAddress}
            </h2>
            <p className="mt-3 text-sm leading-relaxed">{formatAddress(order.shippingAddress)}</p>
            {order.customerNote && (
              <p className="mt-4 border-t border-border pt-4 text-sm text-muted">
                <span className="font-medium text-foreground">{labels.customerNote}: </span>
                {order.customerNote}
              </p>
            )}
          </section>

          <section aria-labelledby="admin-order-payment" className={`${panel} flex items-center gap-4 p-5`}>
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-success text-brand-foreground">
              <CashIcon className="size-[1.125rem]" />
            </span>
            <div className="flex flex-col">
              <h2 id="admin-order-payment" className="font-semibold">
                {labels.payment}
              </h2>
              <p className="text-sm text-muted">
                {cashOnDeliveryLabel} · {paymentStatusLabel(order.paymentStatus, trackLabels)}
              </p>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
