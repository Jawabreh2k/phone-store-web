"use client";

import { useId, useState, type FormEvent } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import * as adminApi from "@/lib/api/admin-client";
import type { AdminProduct, AdminVariant, VariantInput } from "@/lib/api/types";
import { describeVariant, discountPercent, errorCode, parseNumber, catalogErrorMessage, productLimits, stockLevel } from "@/lib/admin-products";
import { formatPrice, plural, t } from "@/lib/format";
import { useAdminAction } from "@/lib/use-admin-action";
import { AdminDialog } from "@/features/admin/admin-dialog";
import { AdornedInput, Field, Switch } from "@/features/admin/admin-form-controls";
import { AdminSection } from "@/features/admin/admin-section";
import { AdminVariantDialog } from "@/features/admin/admin-variant-dialog";
import { VariantLabel } from "@/components/ui/variant-label";
import { AlertIcon, ArrowIcon, HeadphonesIcon, PencilIcon, PhoneIcon, PlusIcon, SlidersIcon } from "@/components/ui/icons";
import { badgeAccent, badgeMuted, buttonGhost, buttonPrimary, buttonSecondary, emptyArea, iconButton, notice } from "@/components/ui/ui";

interface Props {
  locale: Locale;
  product: Pick<AdminProduct, "id" | "type" | "slug" | "isPublished" | "variants">;
  currency: string;
  labels: Dictionary["admin"]["variants"];
  languages: Dictionary["admin"]["languages"];
  errorLabels: Dictionary["admin"]["catalogErrors"];
  closeLabel: string;
}

type Dialog = { kind: "add" } | { kind: "edit"; variant: AdminVariant } | { kind: "stock"; variant: AdminVariant } | { kind: "hideLast"; variant: AdminVariant };

const toInput = (v: AdminVariant): VariantInput => ({
  sku: v.sku,
  color: v.color,
  colorHex: v.colorHex,
  storageGb: v.storageGb,
  ramGb: v.ramGb,
  price: v.price,
  compareAtPrice: v.compareAtPrice,
});

/** The product's options (memory × colour), each with its price, stock and on-sale switch. */
export function AdminProductVariants({ locale, product, currency, labels, languages, errorLabels, closeLabel }: Props) {
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toggling, setToggling] = useState<{ id: string; isActive: boolean } | null>(null);
  const { run, busy } = useAdminAction(locale, { storefront: "catalog" });

  const { variants } = product;
  const activeCount = variants.filter((v) => v.isActive).length;
  const totalStock = variants.reduce((sum, v) => sum + v.stockQuantity, 0);
  const money = (amount: number) => formatPrice(amount, currency, locale);
  const nameOf = (v: AdminVariant) => describeVariant(v, locale, labels.ramTemplate) || labels.standard;
  const close = () => setDialog(null);

  const setActive = async (variant: AdminVariant, isActive: boolean) => {
    setDialog(null);
    setError(null);
    setToggling({ id: variant.id, isActive });
    const result = await run(() => adminApi.updateVariant(locale, product.id, variant.id, toInput(variant), isActive));
    if (!result.ok) {
      setToggling(null);
      setError(catalogErrorMessage(result.error, errorLabels));
    }
  };

  const onToggle = (variant: AdminVariant, isActive: boolean) => {
    // Hiding the last option on sale unpublishes the product (a published product must have something to sell).
    if (!isActive && product.isPublished && activeCount === 1) setDialog({ kind: "hideLast", variant });
    else void setActive(variant, isActive);
  };

  const addButton = (
    <button type="button" onClick={() => setDialog({ kind: "add" })} disabled={variants.length >= productLimits.maxVariants} className={buttonSecondary}>
      <PlusIcon />
      {labels.add}
    </button>
  );

  return (
    <AdminSection id="variants" title={labels.title} description={labels.description} icon={<SlidersIcon />} action={variants.length > 0 && addButton}>
      {error && (
        <p role="alert" className={`${notice} mb-4`}>
          <AlertIcon />
          {error}
        </p>
      )}

      {variants.length === 0 ? (
        <div className={emptyArea}>
          <span aria-hidden className="inline-flex size-14 items-center justify-center rounded-full bg-brand/5 text-brand">
            {product.type === "Phone" ? <PhoneIcon className="size-6" /> : <HeadphonesIcon className="size-6" />}
          </span>
          <p className="font-semibold">{labels.emptyTitle}</p>
          <p className="max-w-sm text-sm leading-relaxed text-muted">{product.type === "Phone" ? labels.emptyBodyPhone : labels.emptyBodyAccessory}</p>
          <button type="button" onClick={() => setDialog({ kind: "add" })} className={`${buttonPrimary} mt-2 h-11 px-6`}>
            <PlusIcon />
            {labels.add}
          </button>
        </div>
      ) : (
        <>
          <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-2xl border border-border">
            {variants.map((variant) => {
              const name = nameOf(variant);
              const level = stockLevel(variant.stockQuantity);
              const active = toggling?.id === variant.id && busy ? toggling.isActive : variant.isActive;
              const discount = discountPercent(variant.price, variant.compareAtPrice);
              return (
                <li
                  key={variant.id}
                  className={`grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-3 px-4 py-4 transition-colors sm:px-5 md:grid-cols-[auto_minmax(0,1.4fr)_minmax(0,0.9fr)_minmax(0,1.1fr)_auto] ${
                    active ? "bg-surface" : "bg-background/70"
                  }`}
                >
                  <VariantSwatch variant={variant} phone={product.type === "Phone"} />

                  <div className={`flex min-w-0 flex-col gap-1 ${active ? "" : "opacity-60"}`}>
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">
                        <VariantLabel label={name} />
                      </span>
                      {!active && <span className={badgeMuted}>{labels.hidden}</span>}
                    </span>
                    <bdi dir="ltr" className="truncate font-mono text-xs text-muted">
                      {variant.sku}
                    </bdi>
                  </div>

                  <div className="flex items-center gap-1 md:order-last">
                    <Switch checked={active} onChange={(checked) => onToggle(variant, checked)} ariaLabel={t(labels.sellToggle, { name })} disabled={busy} />
                    <button type="button" onClick={() => setDialog({ kind: "edit", variant })} aria-label={t(labels.edit, { name })} className={`${iconButton} ms-2 border-transparent bg-transparent hover:bg-foreground/5`}>
                      <PencilIcon />
                    </button>
                  </div>

                  <div className="col-span-full grid grid-cols-2 gap-4 border-t border-border/70 pt-3 md:col-span-2 md:border-t-0 md:pt-0">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs text-muted md:sr-only">{labels.price}</span>
                      <bdi className="font-semibold tabular-nums">{money(variant.price)}</bdi>
                      {variant.compareAtPrice !== null && (
                        <span className="flex items-center gap-1.5 text-xs">
                          <bdi className="text-muted tabular-nums line-through">{money(variant.compareAtPrice)}</bdi>
                          {discount !== null && (
                            <bdi dir="ltr" className="font-semibold text-accent">
                              −{discount}%
                            </bdi>
                          )}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col items-start gap-1">
                      <span className="text-xs text-muted md:sr-only">{labels.stock}</span>
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold tabular-nums">{variant.stockQuantity.toLocaleString("en")}</span>
                        {level !== "ok" && <span className={badgeAccent}>{level === "out" ? labels.outOfStock : labels.lowStock}</span>}
                      </span>
                      <button
                        type="button"
                        onClick={() => setDialog({ kind: "stock", variant })}
                        aria-label={t(labels.adjustFor, { name })}
                        className="text-xs font-medium text-brand underline-offset-4 hover:underline"
                      >
                        {labels.adjust}
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-xs text-muted">
            {plural(labels.optionCount, variants.length, locale)} · {plural(labels.unitCount, totalStock, locale)}
          </p>
        </>
      )}

      {(dialog?.kind === "add" || dialog?.kind === "edit") && (
        <AdminVariantDialog
          locale={locale}
          productId={product.id}
          productType={product.type}
          productSlug={product.slug}
          variant={dialog.kind === "edit" ? dialog.variant : undefined}
          siblings={dialog.kind === "edit" ? variants.filter((v) => v.id !== dialog.variant.id) : variants}
          currency={currency}
          onClose={close}
          labels={labels}
          languages={languages}
          errorLabels={errorLabels}
          closeLabel={closeLabel}
        />
      )}

      {dialog?.kind === "stock" && (
        <StockDialog locale={locale} productId={product.id} variant={dialog.variant} name={nameOf(dialog.variant)} onClose={close} labels={labels} errorLabels={errorLabels} closeLabel={closeLabel} />
      )}

      <AdminDialog
        open={dialog?.kind === "hideLast"}
        onClose={close}
        title={labels.hideLastTitle}
        description={labels.hideLastBody}
        closeLabel={closeLabel}
        footer={
          <>
            <button type="button" onClick={close} className={buttonGhost}>
              {labels.cancel}
            </button>
            <button type="button" onClick={() => dialog?.kind === "hideLast" && void setActive(dialog.variant, false)} className={`${buttonPrimary} h-11 px-6`}>
              {labels.hideLastConfirm}
            </button>
          </>
        }
      >
        {dialog?.kind === "hideLast" && (
          <p className="text-sm font-medium">
            <VariantLabel label={nameOf(dialog.variant)} />
          </p>
        )}
      </AdminDialog>
    </AdminSection>
  );
}

function VariantSwatch({ variant, phone }: { variant: AdminVariant; phone: boolean }) {
  if (variant.colorHex) {
    return <span aria-hidden className="size-10 shrink-0 rounded-full border-2 border-surface ring-1 ring-foreground/15" style={{ backgroundColor: variant.colorHex }} />;
  }
  return (
    <span aria-hidden className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-foreground/5 text-muted">
      {phone ? <PhoneIcon /> : <HeadphonesIcon />}
    </span>
  );
}

interface StockDialogProps {
  locale: Locale;
  productId: string;
  variant: AdminVariant;
  name: string;
  onClose: () => void;
  labels: Dictionary["admin"]["variants"];
  errorLabels: Dictionary["admin"]["catalogErrors"];
  closeLabel: string;
}

/** Records a delivery or a shortfall as a change in units, so a sale in the meantime is never overwritten. */
function StockDialog({ locale, productId, variant, name, onClose, labels, errorLabels, closeLabel }: StockDialogProps) {
  const formId = useId();
  const [mode, setMode] = useState<"add" | "remove">("add");
  const [quantity, setQuantity] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { run, reload, busy } = useAdminAction(locale, { storefront: "catalog" });
  const copy = labels.stockDialog;

  const amount = parseNumber(quantity);
  const valid = Number.isInteger(amount) && amount > 0;
  const current = variant.stockQuantity;
  const after = valid ? current + (mode === "add" ? amount : -amount) : current;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    if (!valid) return setError(copy.invalid);
    if (after < 0) return setError(t(copy.tooMany, { count: current }));
    if (after > productLimits.maxStock) return setError(errorLabels["catalog.invalid_stock"]);

    setError(null);
    const result = await run(() => adminApi.adjustStock(locale, productId, variant.id, mode === "add" ? amount : -amount));
    if (result.ok) return onClose();

    setError(catalogErrorMessage(result.error, errorLabels));
    // An order took units at the same moment: show the current count before staff retry.
    if (errorCode(result.error) === "concurrency_conflict") reload();
  };

  const modeOption = (value: "add" | "remove", label: string) => (
    <label className="inline-flex h-10 flex-1 cursor-pointer items-center justify-center rounded-full px-4 text-sm font-medium text-muted transition-colors hover:text-foreground has-checked:bg-brand has-checked:text-brand-foreground has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-brand">
      <input type="radio" name={`${formId}-mode`} value={value} checked={mode === value} onChange={() => setMode(value)} className="sr-only" />
      {label}
    </label>
  );

  return (
    <AdminDialog
      open
      onClose={onClose}
      busy={busy}
      title={copy.title}
      description={<VariantLabel label={name} />}
      closeLabel={closeLabel}
      footer={
        <>
          <button type="button" onClick={onClose} disabled={busy} className={buttonGhost}>
            {labels.cancel}
          </button>
          <button type="submit" form={formId} disabled={busy} className={`${buttonPrimary} h-11 px-6`}>
            {busy ? labels.saving : copy.apply}
          </button>
        </>
      }
    >
      <form id={formId} noValidate onSubmit={submit} className="flex flex-col gap-5">
        <fieldset>
          <legend className="sr-only">{copy.modeLabel}</legend>
          <div className="flex gap-1 rounded-full border border-border bg-background p-1">
            {modeOption("add", copy.add)}
            {modeOption("remove", copy.remove)}
          </div>
        </fieldset>

        <Field label={copy.quantity} hint={copy.quantityHint} error={error ?? undefined}>
          {(control) => (
            <AdornedInput
              {...control}
              inputMode="numeric"
              dialogAutoFocus
              value={quantity}
              placeholder="0"
              prefix={mode === "add" ? "+" : "−"}
              suffix={labels.unitsSuffix}
              disabled={busy}
              onChange={(value) => {
                setQuantity(value);
                setError(null);
              }}
            />
          )}
        </Field>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-2xl bg-background px-5 py-4">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-muted">{copy.current}</span>
            <span className="text-2xl font-semibold tabular-nums">{current.toLocaleString("en")}</span>
          </div>
          <ArrowIcon className="size-5 text-muted" />
          <div className="flex flex-col items-end gap-0.5 text-end">
            <span className="text-xs text-muted">{copy.result}</span>
            <span className={`text-2xl font-semibold tabular-nums ${after < 0 ? "text-accent" : after === current ? "text-muted" : "text-brand"}`}>
              {after.toLocaleString("en")}
            </span>
          </div>
        </div>
      </form>
    </AdminDialog>
  );
}
