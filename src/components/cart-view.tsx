"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { CartLoadError } from "@/components/cart-load-error";
import { useCart } from "@/components/cart-provider";
import { AlertIcon, CartIcon, CashIcon, CheckIcon, MinusIcon, PlusIcon, RouteIcon, TrashIcon, TruckIcon } from "@/components/icons";
import { ProductImagePlaceholder } from "@/components/product-image-placeholder";
import { VariantLabel } from "@/components/variant-label";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { cartErrorMessage, maxQuantityPerLine } from "@/lib/cart-errors";
import type { CartLineDto } from "@/lib/api/types";
import { formatPrice } from "@/lib/format";
import { Fill } from "./fill";
import { CartPageSkeleton } from "./skeletons";
import { buttonGhost, buttonPrimary, notice as noticeBox, panel, panelTitle, quantityButton } from "./ui";

type CartNotice = "empty" | "unavailable" | "stock_changed";

interface Props {
  locale: Locale;
  labels: Dictionary["cart"];
  notice?: CartNotice | null;
  /** From the store settings; shows how far the cart is from free delivery. Null when there is none. */
  freeShippingThreshold: number | null;
}

export function CartView({ locale, labels, notice, freeShippingThreshold }: Props) {
  const { cart, status, updateLine, removeLine, refresh } = useCart();
  const [busyLine, setBusyLine] = useState<string | null>(null);
  const [lineErrors, setLineErrors] = useState<Record<string, string>>({});

  if (status === "error") {
    return <CartLoadError labels={labels} onRetry={refresh} />;
  }

  if (status === "loading") {
    return (
      <div aria-busy="true">
        <CartPageSkeleton />
      </div>
    );
  }

  const isEmpty = !cart || cart.lines.length === 0;

  if (isEmpty) {
    const emptyNotice = notice === "empty" ? labels.noticeEmpty : null;

    return (
      <div className="flex flex-col items-center gap-5 rounded-panel border border-border bg-surface px-6 py-16 text-center sm:py-24">
        {emptyNotice && (
          <p className={`${noticeBox} max-w-sm text-start`} role="status">
            <AlertIcon />
            {emptyNotice}
          </p>
        )}
        <span aria-hidden className="inline-flex size-20 items-center justify-center rounded-full bg-brand/5 text-brand">
          <CartIcon className="size-9" />
        </span>
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{labels.emptyTitle}</h2>
        <p className="max-w-sm text-muted">{labels.emptyBody}</p>
        <Link href={`/${locale}/products`} className={buttonPrimary}>
          {labels.browseProducts}
        </Link>
      </div>
    );
  }

  const changeQuantity = async (line: CartLineDto, nextQuantity: number) => {
    setBusyLine(line.variantId);
    setLineErrors((prev) => {
      const next = { ...prev };
      delete next[line.variantId];
      return next;
    });

    try {
      if (nextQuantity <= 0) {
        await removeLine(line.variantId);
      } else {
        await updateLine(line.variantId, nextQuantity);
      }
    } catch (error) {
      setLineErrors((prev) => ({
        ...prev,
        [line.variantId]: cartErrorMessage(error, labels.errors, labels.quantityLimit),
      }));
    } finally {
      setBusyLine(null);
    }
  };

  const noticeMessage =
    notice === "stock_changed"
      ? labels.noticeStockChanged
      : notice === "unavailable"
        ? labels.noticeUnavailable
        : notice === "empty"
          ? labels.noticeEmpty
          : null;

  const money = (amount: number) => formatPrice(amount, cart.currencyCode, locale);
  const remaining = freeShippingThreshold ? freeShippingThreshold - cart.subtotal : null;

  return (
    <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:items-start lg:gap-12">
      <div className="flex flex-col gap-4">
        {noticeMessage && (
          <p className={noticeBox} role="status">
            <AlertIcon />
            {noticeMessage}
          </p>
        )}

        {cart.hasUnavailableItems && (
          <p className={noticeBox} role="status">
            <AlertIcon />
            {labels.unavailableWarning}
          </p>
        )}

        <ul className={`${panel} divide-y divide-border`}>
          {cart.lines.map((line) => {
            const busy = busyLine === line.variantId;
            const error = lineErrors[line.variantId];

            return (
              <li key={line.variantId} className="flex gap-4 p-4 sm:gap-5 sm:p-5">
                <Link
                  href={`/${locale}/products/${line.productSlug}`}
                  className={`relative aspect-square w-20 shrink-0 overflow-hidden rounded-2xl bg-background sm:w-24 ${line.isAvailable ? "" : "opacity-50"}`}
                >
                  {line.imageUrl ? (
                    <Image src={line.imageUrl} alt={line.productName} fill sizes="6rem" className="object-contain p-2" />
                  ) : (
                    <ProductImagePlaceholder name={line.productName} />
                  )}
                </Link>

                <div className="flex min-w-0 flex-1 flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-col gap-1">
                      <Link href={`/${locale}/products/${line.productSlug}`} className="text-[15px] leading-snug font-medium hover:text-brand">
                        {line.productName}
                      </Link>
                      <p className="text-sm text-muted">
                        <VariantLabel label={line.variantLabel} />
                      </p>
                      {line.quantity > 1 && (
                        <p className="text-xs text-muted">
                          <Fill template={labels.each} values={{ price: <bdi>{money(line.unitPrice)}</bdi> }} />
                        </p>
                      )}
                      {!line.isAvailable && <p className="text-sm font-medium text-accent">{labels.lineUnavailable}</p>}
                    </div>
                    <bdi className="shrink-0 text-base font-semibold tracking-tight tabular-nums sm:text-lg">{money(line.lineTotal)}</bdi>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <span className="sr-only">{labels.quantity}</span>
                      <button
                        type="button"
                        aria-label={labels.decrease}
                        disabled={busy}
                        onClick={() => changeQuantity(line, line.quantity - 1)}
                        className={quantityButton}
                      >
                        <MinusIcon />
                      </button>
                      <span className="min-w-8 text-center text-sm font-medium tabular-nums" aria-live="polite">
                        {busy ? "…" : line.quantity}
                      </span>
                      <button
                        type="button"
                        aria-label={labels.increase}
                        disabled={busy || line.quantity >= Math.min(maxQuantityPerLine, line.availableQuantity)}
                        onClick={() => changeQuantity(line, line.quantity + 1)}
                        className={quantityButton}
                      >
                        <PlusIcon />
                      </button>
                    </div>

                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => changeQuantity(line, 0)}
                      className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-muted transition-colors hover:bg-foreground/5 hover:text-foreground disabled:opacity-50 pointer-coarse:h-11"
                    >
                      <TrashIcon />
                      {labels.remove}
                    </button>
                  </div>

                  {error && (
                    <p className="text-sm text-accent" role="alert">
                      {error}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <aside className={`${panel} flex flex-col gap-5 p-5 sm:p-6 lg:sticky lg:top-28`}>
        <h2 className={panelTitle}>{labels.summary}</h2>

        {remaining !== null && freeShippingThreshold && (
          <div className="flex flex-col gap-2.5 rounded-2xl bg-background p-3.5">
            <p className="flex items-center gap-2 text-sm font-medium">
              {remaining > 0 ? <TruckIcon className="size-4 shrink-0 text-brand" /> : <CheckIcon className="size-4 shrink-0 text-success" />}
              {remaining > 0 ? <Fill template={labels.freeShippingProgress} values={{ amount: <bdi>{money(remaining)}</bdi> }} /> : labels.freeShippingUnlocked}
            </p>
            <div aria-hidden className="h-1.5 overflow-hidden rounded-full bg-border">
              <div className="h-full rounded-full bg-brand" style={{ width: `${Math.min(100, (cart.subtotal / freeShippingThreshold) * 100)}%` }} />
            </div>
          </div>
        )}

        <dl className="flex flex-col gap-3 text-sm">
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-muted">{labels.subtotal}</dt>
            <dd className="font-medium tabular-nums">
              <bdi>{money(cart.subtotal)}</bdi>
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-muted">{labels.shipping}</dt>
            <dd className="font-medium tabular-nums">{cart.shippingFee === 0 ? <span className="text-success">{labels.free}</span> : <bdi>{money(cart.shippingFee)}</bdi>}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 border-t border-border pt-3 text-base">
            <dt className="font-semibold">{labels.total}</dt>
            <dd className="text-xl font-semibold tracking-tight tabular-nums">
              <bdi>{money(cart.total)}</bdi>
            </dd>
          </div>
        </dl>

        <Link
          href={`/${locale}/checkout`}
          className={`${buttonPrimary} w-full ${cart.hasUnavailableItems ? "pointer-events-none opacity-50" : ""}`}
          aria-disabled={cart.hasUnavailableItems || undefined}
          tabIndex={cart.hasUnavailableItems ? -1 : undefined}
        >
          {labels.checkout}
        </Link>

        <ul className="flex flex-col gap-2.5 border-t border-border pt-5 text-sm text-muted">
          <li className="flex items-center gap-2.5">
            <CashIcon className="size-4 shrink-0 text-success" />
            {labels.codNote}
          </li>
          <li className="flex items-center gap-2.5">
            <RouteIcon className="size-4 shrink-0 text-brand" />
            {labels.trackNote}
          </li>
        </ul>

        <Link href={`/${locale}/products`} className={`${buttonGhost} -mb-2 self-center`}>
          {labels.continueShopping}
        </Link>
      </aside>
    </div>
  );
}
