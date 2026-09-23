"use client";

import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import type { Variant } from "@/lib/api/types";
import { formatPrice, t } from "@/lib/format";
import { buttonPrimary, chipActive, chipIdle, eyebrow } from "./ui";

interface Props {
  variants: Variant[];
  currency: string;
  locale: Locale;
  labels: {
    chooseOption: string;
    addToCart: string;
    outOfStock: string;
    inStock: string;
    onlyLeft: string;
    comingSoon: string;
    sale: string;
  };
}

/**
 * Labels mix Latin and Arabic ("256 GB · 8 GB رام · أسود"). Isolating each segment with <bdi>
 * stops the bidi algorithm from reordering numbers and units across segments in RTL.
 */
function VariantLabel({ label }: { label: string }) {
  const parts = label.split(" · ");
  return (
    <span>
      {parts.map((part, i) => (
        <span key={i}>
          {i > 0 && " · "}
          <bdi>{part}</bdi>
        </span>
      ))}
    </span>
  );
}

/** Lets the customer pick storage/colour. Starts on the cheapest in-stock variant. */
export function VariantPicker({ variants, currency, locale, labels }: Props) {
  const initial = variants.find((v) => v.inStock) ?? variants[0];
  const [selectedId, setSelectedId] = useState(initial?.id);
  const selected = variants.find((v) => v.id === selectedId) ?? initial;

  // Phones: while the main Add to cart button is off screen (and the footer isn't in view),
  // a bar pinned to the bottom keeps price and the action within thumb reach.
  const buyButton = useRef<HTMLDivElement>(null);
  const [showBar, setShowBar] = useState(false);
  useEffect(() => {
    const button = buyButton.current;
    if (!button) return;
    const footer = document.querySelector("footer");
    let buttonVisible = true;
    let footerVisible = false;
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === button) buttonVisible = entry.isIntersecting;
        else footerVisible = entry.isIntersecting;
      }
      setShowBar(!buttonVisible && !footerVisible);
    });
    observer.observe(button);
    if (footer) observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  if (!selected) return null;

  const onSale = selected.compareAtPrice !== null && selected.compareAtPrice > selected.price;
  const stockText = !selected.inStock
    ? labels.outOfStock
    : selected.lowStockQuantity
      ? t(labels.onlyLeft, { count: selected.lowStockQuantity })
      : labels.inStock;
  const stockTone = !selected.inStock || selected.lowStockQuantity ? "text-accent" : "text-success";

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-3xl font-semibold tracking-tight sm:text-4xl">{formatPrice(selected.price, currency, locale)}</span>
        {onSale && (
          <>
            <span className="text-lg text-muted line-through">{formatPrice(selected.compareAtPrice!, currency, locale)}</span>
            <span className="text-xs font-medium text-accent">{labels.sale}</span>
          </>
        )}
      </div>

      {variants.length > 1 && (
        <fieldset className="flex flex-col gap-3">
          <legend className={`${eyebrow} mb-3`}>{labels.chooseOption}</legend>
          <div className="flex flex-wrap gap-2">
            {variants.map((variant) => {
              const active = variant.id === selected.id;
              return (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => setSelectedId(variant.id)}
                  aria-pressed={active}
                  className={`${active ? chipActive : chipIdle} ${variant.inStock ? "" : "line-through decoration-1 opacity-60"}`}
                >
                  {variant.colorHex && (
                    <span
                      aria-hidden
                      className={`size-3.5 rounded-full ring-1 ${active ? "ring-brand-foreground/60" : "ring-border"}`}
                      style={{ backgroundColor: variant.colorHex }}
                    />
                  )}
                  <VariantLabel label={variant.label || variant.sku} />
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      <div className="flex flex-col gap-3">
        <p className={`flex items-center gap-2 text-sm ${stockTone}`}>
          <span aria-hidden className="size-1.5 rounded-full bg-current" />
          {stockText}
        </p>

        {/* Wired to the cart API in the next phase. */}
        <div ref={buyButton}>
          <button type="button" disabled title={labels.comingSoon} className={`${buttonPrimary} w-full`}>
            {labels.addToCart}
          </button>
        </div>
      </div>

      {/* Sticky buy bar (phones only). Hidden bars are inert so they can't be tabbed into. */}
      <div
        inert={!showBar}
        aria-hidden={!showBar}
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] motion-safe:transition-transform motion-safe:duration-300 md:hidden ${
          showBar ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-muted">
              <VariantLabel label={selected.label || selected.sku} />
            </p>
            <p className="text-lg font-semibold tracking-tight">{formatPrice(selected.price, currency, locale)}</p>
          </div>
          <button type="button" disabled title={labels.comingSoon} className={buttonPrimary}>
            {labels.addToCart}
          </button>
        </div>
      </div>
    </div>
  );
}
