"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/components/cart-provider";
import { VariantLabel } from "@/components/variant-label";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { cartErrorMessage } from "@/lib/cart-errors";
import type { ProductType, Variant } from "@/lib/api/types";
import { formatPrice, t } from "@/lib/format";
import { colorKey, initialVariant, memoryKey, storageLabel, variantAxes } from "@/lib/variants";
import { Fill } from "./fill";
import { CheckIcon } from "./icons";
import { ProductArt } from "./product-art";
import { buttonPrimary, chipActive, chipIdle, optionCard, swatch, swatchFill } from "./ui";

interface Props {
  variants: Variant[];
  currency: string;
  locale: Locale;
  /** For the sticky bar's thumbnail. */
  product: { type: ProductType; imageUrl: string | null };
  labels: {
    chooseOption: string;
    addToCart: string;
    outOfStock: string;
    inStock: string;
    onlyLeft: string;
    added: string;
    errors: Dictionary["cart"]["errors"];
    quantityLimit: string;
    colour: string;
    memory: string;
    ram: string;
    save: string;
    otherColours: string;
  };
}

/** Distinct values of an axis, in the order the variants first use them. */
function distinct(variants: Variant[], key: (v: Variant) => string | null): Variant[] {
  return [...new Map(variants.map((v) => [key(v), v])).values()];
}

/**
 * Lets the customer pick a variant: colour swatches and memory options when the variants form those axes,
 * otherwise one list of variants. Starts on the first in-stock variant. A choice that doesn't exist in the
 * current colour (or memory) switches the other axis instead of failing.
 */
export function VariantPicker({ variants, currency, locale, product, labels }: Props) {
  const { addItem } = useCart();
  const initial = initialVariant(variants);
  const [selectedId, setSelectedId] = useState(initial?.id);
  const selected = variants.find((v) => v.id === selectedId) ?? initial;
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const root = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    if (!feedback || feedback.type !== "success") return;
    const timer = window.setTimeout(() => setFeedback(null), 3000);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  // The photo stand-in on this page is drawn in --variant-color (set on [data-product]); follow the choice.
  const selectedHex = selected?.colorHex;
  useEffect(() => {
    if (selectedHex) root.current?.closest<HTMLElement>("[data-product]")?.style.setProperty("--variant-color", selectedHex);
  }, [selectedHex]);

  if (!selected) return null;

  const axes = variantAxes(variants);
  const choose = (variant: Variant | undefined) => {
    if (!variant) return;
    setSelectedId(variant.id);
    setFeedback(null);
  };
  // The first match, preferring one in stock.
  const best = (match: (v: Variant) => boolean) => variants.filter(match).sort((a, b) => Number(b.inStock) - Number(a.inStock))[0];
  const chooseColor = (key: string | null) =>
    choose(best((v) => colorKey(v) === key && memoryKey(v) === memoryKey(selected)) ?? best((v) => colorKey(v) === key));
  const chooseMemory = (key: string | null) =>
    choose(best((v) => memoryKey(v) === key && colorKey(v) === colorKey(selected)) ?? best((v) => memoryKey(v) === key));
  const variantFor = (color: string | null, memory: string | null) =>
    variants.find((v) => (!axes?.colors || colorKey(v) === color) && (!axes?.memory || memoryKey(v) === memory));

  const onSale = selected.compareAtPrice !== null && selected.compareAtPrice > selected.price;
  const stockText = !selected.inStock
    ? labels.outOfStock
    : selected.lowStockQuantity
      ? t(labels.onlyLeft, { count: selected.lowStockQuantity })
      : labels.inStock;
  const stockTone = !selected.inStock || selected.lowStockQuantity ? "text-accent" : "text-success";
  const canAdd = selected.inStock && !busy;

  const handleAdd = async () => {
    if (!canAdd) return;
    setBusy(true);
    setFeedback(null);
    try {
      await addItem(selected.id, 1);
      setFeedback({ type: "success", message: labels.added });
    } catch (error) {
      setFeedback({
        type: "error",
        message: cartErrorMessage(error, labels.errors, labels.quantityLimit),
      });
    } finally {
      setBusy(false);
    }
  };

  const feedbackTone = feedback?.type === "success" ? "text-success" : "text-accent";
  const price = formatPrice(selected.price, currency, locale);

  return (
    <div ref={root} className="flex flex-col gap-7">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <bdi className="text-[2rem] leading-none font-semibold tracking-tight sm:text-4xl">{price}</bdi>
        {onSale && (
          <>
            <bdi className="text-lg text-muted line-through">{formatPrice(selected.compareAtPrice!, currency, locale)}</bdi>
            <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-brand-foreground">
              <Fill template={labels.save} values={{ amount: <bdi>{formatPrice(selected.compareAtPrice! - selected.price, currency, locale)}</bdi> }} />
            </span>
          </>
        )}
      </div>

      {axes ? (
        <>
          {axes.colors && (
            <fieldset>
              <legend className="mb-3 text-sm">
                <span className="font-semibold">{labels.colour}: </span>
                <span className="text-muted">{selected.color}</span>
              </legend>
              <div className="flex flex-wrap gap-2">
                {distinct(variants, colorKey).map((option) => {
                  const key = colorKey(option);
                  const combo = variantFor(key, memoryKey(selected));
                  const soldOut = combo ? !combo.inStock : !variants.some((v) => colorKey(v) === key && v.inStock);
                  const name = option.color ?? key ?? "";
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => chooseColor(key)}
                      aria-pressed={colorKey(selected) === key}
                      aria-label={soldOut ? `${name}, ${labels.outOfStock}` : name}
                      className={swatch}
                    >
                      <span
                        className={`${swatchFill} relative ${option.colorHex ? "" : "bg-border"} ${soldOut ? "after:absolute after:inset-x-1 after:top-1/2 after:h-[1.5px] after:-rotate-45 after:bg-foreground/55" : ""}`}
                        style={option.colorHex ? { backgroundColor: option.colorHex } : undefined}
                      />
                    </button>
                  );
                })}
              </div>
            </fieldset>
          )}

          {axes.memory && (
            <fieldset>
              <legend className="mb-3 text-sm font-semibold">{labels.memory}</legend>
              <div className="grid grid-cols-3 gap-2">
                {distinct(variants, memoryKey)
                  .sort((a, b) => a.storageGb! - b.storageGb! || (a.ramGb ?? 0) - (b.ramGb ?? 0))
                  .map((option) => {
                    const key = memoryKey(option);
                    const combo = variantFor(colorKey(selected), key);
                    const soldOut = combo ? !combo.inStock : false;
                    const note = !combo ? (
                      labels.otherColours
                    ) : soldOut ? (
                      labels.outOfStock
                    ) : option.ramGb ? (
                      <Fill template={labels.ram} values={{ ram: <bdi>{option.ramGb} GB</bdi> }} />
                    ) : null;
                    return (
                      <button key={key} type="button" onClick={() => chooseMemory(key)} aria-pressed={memoryKey(selected) === key} className={optionCard}>
                        <bdi className={`text-[15px] font-semibold ${soldOut ? "text-muted line-through decoration-1" : ""}`}>{storageLabel(option.storageGb!)}</bdi>
                        {note && <span className="text-xs text-muted">{note}</span>}
                      </button>
                    );
                  })}
              </div>
            </fieldset>
          )}
        </>
      ) : (
        variants.length > 1 && (
          <fieldset>
            <legend className="mb-3 text-sm font-semibold">{labels.chooseOption}</legend>
            <div className="flex flex-wrap gap-2">
              {variants.map((variant) => {
                const active = variant.id === selected.id;
                return (
                  <button
                    key={variant.id}
                    type="button"
                    onClick={() => choose(variant)}
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
        )
      )}

      <div className="flex flex-col gap-3">
        <p className={`flex items-center gap-2 text-sm font-medium ${stockTone}`}>
          <span aria-hidden className="size-2 rounded-full bg-current" />
          {stockText}
        </p>

        <div ref={buyButton} className="flex flex-col gap-2">
          <button type="button" disabled={!canAdd} onClick={handleAdd} className={`${buttonPrimary} w-full`}>
            {busy ? "…" : labels.addToCart}
          </button>
          {/* The one live region for add-to-cart feedback; the sticky bar repeats it visually only. */}
          {feedback && (
            <p className={`flex items-center gap-2 text-sm ${feedbackTone}`} role={feedback.type === "error" ? "alert" : "status"}>
              {feedback.type === "success" && <CheckIcon />}
              {feedback.message}
            </p>
          )}
        </div>
      </div>

      <div
        inert={!showBar}
        aria-hidden={!showBar}
        className={`fixed inset-x-0 bottom-0 z-40 rounded-t-[1.25rem] border-t border-border bg-surface px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-float motion-safe:transition-transform motion-safe:duration-300 md:hidden ${
          showBar ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <span className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-background">
              {product.imageUrl ? (
                <Image src={product.imageUrl} alt="" fill sizes="48px" className="object-contain p-1" />
              ) : (
                <ProductArt type={product.type} colors={selected.colorHex ? [selected.colorHex] : []} className="size-full" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs text-muted">
                <VariantLabel label={selected.label || selected.sku} />
              </p>
              <bdi className="text-lg font-semibold tracking-tight">{price}</bdi>
            </div>
            <button type="button" disabled={!canAdd} onClick={handleAdd} className={`${buttonPrimary} px-5`}>
              {busy ? "…" : labels.addToCart}
            </button>
          </div>
          {feedback && (
            <p aria-hidden className={`text-sm ${feedbackTone}`}>
              {feedback.message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
