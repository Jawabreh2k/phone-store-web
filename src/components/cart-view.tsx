"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { CartLoadError } from "@/components/cart-load-error";
import { useCart } from "@/components/cart-provider";
import { CartIcon, MinusIcon, PlusIcon } from "@/components/icons";
import { ProductImagePlaceholder } from "@/components/product-image-placeholder";
import { VariantLabel } from "@/components/variant-label";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { cartErrorMessage, maxQuantityPerLine } from "@/lib/cart-errors";
import type { CartLineDto } from "@/lib/api/types";
import { formatPrice } from "@/lib/format";
import { CartPageSkeleton } from "./skeletons";
import { buttonPrimary, quantityButton, textLink } from "./ui";

type CartNotice = "empty" | "unavailable" | "stock_changed";

interface Props {
  locale: Locale;
  labels: Dictionary["cart"];
  notice?: CartNotice | null;
}

export function CartView({ locale, labels, notice }: Props) {
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
      <div className="flex flex-col items-center gap-6 rounded-[2rem] bg-surface px-6 py-20 text-center sm:py-28">
        {emptyNotice && (
          <p className="max-w-sm rounded-2xl border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-accent" role="status">
            {emptyNotice}
          </p>
        )}
        <CartIcon className="size-16 text-muted" aria-hidden />
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

  return (
    <div className="flex flex-col gap-10 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:items-start lg:gap-16">
      <div className="flex flex-col gap-6">
        {noticeMessage && (
          <p className="rounded-2xl border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-accent" role="status">
            {noticeMessage}
          </p>
        )}

        {cart.hasUnavailableItems && (
          <p className="rounded-2xl border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-accent" role="status">
            {labels.unavailableWarning}
          </p>
        )}

        <ul className="flex flex-col gap-4">
          {cart.lines.map((line) => {
            const busy = busyLine === line.variantId;
            const error = lineErrors[line.variantId];

            return (
              <li
                key={line.variantId}
                className={`flex gap-4 rounded-[1.5rem] border border-border bg-surface p-4 sm:gap-5 sm:p-5 ${line.isAvailable ? "" : "opacity-70"}`}
              >
                <Link
                  href={`/${locale}/products/${line.productSlug}`}
                  className="relative aspect-square w-24 shrink-0 overflow-hidden rounded-2xl bg-background sm:w-28"
                >
                  {line.imageUrl ? (
                    <Image src={line.imageUrl} alt={line.productName} fill sizes="7rem" className="object-contain p-2" />
                  ) : (
                    <ProductImagePlaceholder name={line.productName} />
                  )}
                </Link>

                <div className="flex min-w-0 flex-1 flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <Link href={`/${locale}/products/${line.productSlug}`} className="text-[15px] font-medium leading-snug hover:text-brand">
                      {line.productName}
                    </Link>
                    <p className="text-sm text-muted">
                      <VariantLabel label={line.variantLabel} />
                    </p>
                    {!line.isAvailable && (
                      <p className="text-sm text-accent">{labels.lineUnavailable}</p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm text-muted">{formatPrice(line.unitPrice, cart.currencyCode, locale)}</span>
                      <span className="text-lg font-semibold tracking-tight">{formatPrice(line.lineTotal, cart.currencyCode, locale)}</span>
                    </div>

                    <div className="flex flex-col items-end gap-2">
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
                        className={`${textLink} disabled:opacity-50`}
                      >
                        {labels.remove}
                      </button>
                    </div>
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

      <aside className="flex flex-col gap-6 rounded-[1.5rem] border border-border bg-surface p-5 sm:p-6 lg:sticky lg:top-28">
        <dl className="flex flex-col gap-3 text-sm">
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-muted">{labels.subtotal}</dt>
            <dd className="font-medium tabular-nums">{formatPrice(cart.subtotal, cart.currencyCode, locale)}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-muted">{labels.shipping}</dt>
            <dd className="font-medium tabular-nums">{formatPrice(cart.shippingFee, cart.currencyCode, locale)}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 border-t border-border pt-3 text-base">
            <dt className="font-semibold">{labels.total}</dt>
            <dd className="text-xl font-semibold tracking-tight tabular-nums">{formatPrice(cart.total, cart.currencyCode, locale)}</dd>
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
      </aside>
    </div>
  );
}
