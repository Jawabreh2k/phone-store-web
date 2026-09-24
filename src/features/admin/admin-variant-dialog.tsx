"use client";

import { useId, useState, type FormEvent } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import * as adminApi from "@/lib/api/admin-client";
import type { AdminVariant, LocalizedText, ProductType, VariantInput } from "@/lib/api/types";
import {
  apiFieldErrors,
  discountPercent,
  errorCode,
  formatNumberInput,
  hasMoneyPrecision,
  isValidSku,
  localized,
  parseNumber,
  catalogErrorMessage,
  productLimits,
  suggestSku,
} from "@/lib/admin-products";
import { currencyLabel, t } from "@/lib/format";
import { useAdminAction } from "@/lib/use-admin-action";
import { storageLabel } from "@/lib/variants";
import { AdminDialog } from "@/features/admin/admin-dialog";
import { AdornedInput, BilingualField, Field, Switch } from "@/features/admin/admin-form-controls";
import { AlertIcon } from "@/components/ui/icons";
import { buttonGhost, buttonPrimary, chipChoice, fieldLabel, notice, textLink } from "@/components/ui/ui";

interface Props {
  locale: Locale;
  productId: string;
  productType: ProductType;
  productSlug: string;
  /** The option being edited; absent when adding one. */
  variant?: AdminVariant;
  /** The product's other options, for colour reuse and duplicate checks. */
  siblings: AdminVariant[];
  currency: string;
  onClose: () => void;
  labels: Dictionary["admin"]["variants"];
  languages: Dictionary["admin"]["languages"];
  errorLabels: Dictionary["admin"]["catalogErrors"];
  closeLabel: string;
}

interface Draft {
  storageGb: number | null;
  ramGb: number | null;
  color: LocalizedText;
  /** "#RRGGBB", or empty for no swatch. */
  colorHex: string;
  sku: string;
  /** Until staff type a SKU, it follows the product link, storage and colour. */
  skuTouched: boolean;
  price: string;
  compareAtPrice: string;
  stock: string;
  isActive: boolean;
}

type FieldKey = "sku" | "price" | "compareAt" | "colorEn" | "colorAr" | "hex" | "stock";
type FieldErrors = Partial<Record<FieldKey, string>>;

const storageChoices = [32, 64, 128, 256, 512, 1024];
const ramChoices = [3, 4, 6, 8, 12, 16];
const hexPattern = /^#[0-9a-f]{6}$/i;

/** Maps the API's field names ("variant.price") to this form's fields. */
const apiFields: Record<string, FieldKey> = {
  "variant.sku": "sku",
  "variant.price": "price",
  "variant.compareAtPrice": "compareAt",
  "variant.color.en": "colorEn",
  "variant.color.ar": "colorAr",
  "variant.colorHex": "hex",
  stockQuantity: "stock",
};

const fieldForCode: Partial<Record<string, FieldKey>> = {
  "catalog.sku_taken": "sku",
  "catalog.invalid_price": "price",
  "catalog.invalid_stock": "stock",
};

/** The common sizes, plus any unusual size this product already uses so it stays selectable. */
function choicesWith(base: number[], ...extra: (number | null)[]): number[] {
  return [...new Set([...base, ...extra.filter((n): n is number => n !== null)])].sort((a, b) => a - b);
}

function initialDraft(variant: AdminVariant | undefined): Draft {
  return {
    storageGb: variant?.storageGb ?? null,
    ramGb: variant?.ramGb ?? null,
    color: variant?.color ?? { en: "", ar: "" },
    colorHex: variant?.colorHex ?? "",
    sku: variant?.sku ?? "",
    skuTouched: Boolean(variant),
    price: formatNumberInput(variant?.price ?? null),
    compareAtPrice: formatNumberInput(variant?.compareAtPrice ?? null),
    stock: "0",
    isActive: variant?.isActive ?? true,
  };
}

/** Add or edit one option: memory, colour, price, SKU and (when adding) the opening stock. */
export function AdminVariantDialog({ locale, productId, productType, productSlug, variant, siblings, currency, onClose, labels, languages, errorLabels, closeLabel }: Props) {
  const formId = useId();
  const [draft, setDraft] = useState(() => initialDraft(variant));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const { run, busy } = useAdminAction(locale, { storefront: "catalog" });

  const editing = Boolean(variant);
  const isPhone = productType === "Phone";
  const sku = draft.skuTouched ? draft.sku : suggestSku(productSlug, { storageGb: draft.storageGb, colorEn: draft.color.en });
  const unit = currencyLabel(currency, locale);

  const update = (changes: Partial<Draft>, cleared: FieldKey[] = []) => {
    setDraft((current) => ({ ...current, ...changes }));
    setErrors((current) => {
      if (!cleared.some((key) => current[key])) return current;
      const next = { ...current };
      for (const key of cleared) delete next[key];
      return next;
    });
  };

  // Colours already on this product, so the 256 GB Black reuses the 128 GB Black's names and swatch.
  const knownColors = [...new Map(siblings.filter((s) => s.color).map((s) => [s.color!.en.toLowerCase(), s])).values()];

  const validate = (): { errors: FieldErrors; input?: VariantInput; stock?: number } => {
    const found: FieldErrors = {};
    const colorEn = draft.color.en.trim();
    const colorAr = draft.color.ar.trim();
    const hasColor = Boolean(colorEn || colorAr || draft.colorHex);

    if (!sku.trim()) found.sku = labels.fieldErrors.required;
    else if (!isValidSku(sku.trim())) found.sku = labels.fieldErrors.sku;
    else if (siblings.some((s) => s.sku.toUpperCase() === sku.trim().toUpperCase())) found.sku = labels.fieldErrors.skuDuplicate;

    if (hasColor) {
      if (!colorEn || colorEn.length > productLimits.colorNameMax) found.colorEn = labels.fieldErrors.colorBoth;
      if (!colorAr || colorAr.length > productLimits.colorNameMax) found.colorAr = labels.fieldErrors.colorBoth;
    }
    if (draft.colorHex && !hexPattern.test(draft.colorHex)) found.hex = labels.fieldErrors.hex;

    const price = parseNumber(draft.price);
    if (!(price > 0) || !hasMoneyPrecision(price)) found.price = labels.fieldErrors.price;

    const compareAt = draft.compareAtPrice.trim() ? parseNumber(draft.compareAtPrice) : null;
    if (compareAt !== null && !(compareAt > price && hasMoneyPrecision(compareAt))) found.compareAt = labels.fieldErrors.compareAt;

    const stock = parseNumber(draft.stock);
    if (!editing && !(Number.isInteger(stock) && stock >= 0 && stock <= productLimits.maxStock)) found.stock = labels.fieldErrors.stock;

    if (Object.keys(found).length > 0) return { errors: found };
    return {
      errors: found,
      stock,
      input: {
        sku: sku.trim(),
        color: hasColor ? { en: colorEn, ar: colorAr } : null,
        colorHex: hasColor && draft.colorHex ? draft.colorHex.toUpperCase() : null,
        storageGb: draft.storageGb,
        ramGb: draft.ramGb,
        price,
        compareAtPrice: compareAt,
      },
    };
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    setFormError(null);

    const { errors: found, input, stock } = validate();
    setErrors(found);
    if (!input) return;

    // Two options with the same memory and colour can't be told apart on the product page.
    const sameChoice = siblings.some(
      (s) => s.storageGb === input.storageGb && s.ramGb === input.ramGb && (s.color?.en.toLowerCase() ?? "") === (input.color?.en.toLowerCase() ?? ""),
    );
    if (sameChoice) {
      setFormError(labels.fieldErrors.duplicate);
      return;
    }

    const result = await run<unknown>(() =>
      variant ? adminApi.updateVariant(locale, productId, variant.id, input, draft.isActive) : adminApi.addVariant(locale, productId, input, stock ?? 0),
    );
    if (result.ok) {
      onClose();
      return;
    }

    const serverFields = apiFieldErrors(result.error);
    const mapped: FieldErrors = {};
    for (const key of Object.keys(serverFields ?? {})) {
      if (apiFields[key]) mapped[apiFields[key]] = labels.fieldErrors.invalid;
    }
    const codeField = fieldForCode[errorCode(result.error) ?? ""];
    if (codeField) mapped[codeField] = catalogErrorMessage(result.error, errorLabels);

    if (Object.keys(mapped).length > 0) setErrors(mapped);
    else setFormError(catalogErrorMessage(result.error, errorLabels));
  };

  const choiceGroup = (legend: string, name: string, choices: number[], value: number | null, onChange: (value: number | null) => void, format: (n: number) => string) => (
    <fieldset className="flex flex-col gap-2.5">
      <legend className={`${fieldLabel} mb-2.5`}>{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {[null, ...choices].map((choice) => (
          <label key={choice ?? "none"} className={chipChoice}>
            <input type="radio" name={name} checked={value === choice} onChange={() => onChange(choice)} disabled={busy} className="sr-only" />
            {choice === null ? labels.none : <bdi dir="ltr">{format(choice)}</bdi>}
          </label>
        ))}
      </div>
    </fieldset>
  );

  const discount = discountPercent(parseNumber(draft.price), draft.compareAtPrice.trim() ? parseNumber(draft.compareAtPrice) : null);
  const sectionTitle = "text-xs font-semibold tracking-wide text-muted uppercase";

  return (
    <AdminDialog
      open
      onClose={onClose}
      busy={busy}
      size="lg"
      title={editing ? labels.editTitle : labels.addTitle}
      description={labels.dialogDescription}
      closeLabel={closeLabel}
      footer={
        <>
          <button type="button" onClick={onClose} disabled={busy} className={buttonGhost}>
            {labels.cancel}
          </button>
          <button type="submit" form={formId} disabled={busy} className={`${buttonPrimary} h-11 px-6`}>
            {busy ? labels.saving : editing ? labels.save : labels.saveNew}
          </button>
        </>
      }
    >
      <form id={formId} noValidate onSubmit={submit} className="flex flex-col gap-7">
        {formError && (
          <p role="alert" className={notice}>
            <AlertIcon />
            {formError}
          </p>
        )}

        {(isPhone || draft.storageGb !== null || draft.ramGb !== null) && (
          <div className="flex flex-col gap-5">
            <h3 className={sectionTitle}>{labels.memorySection}</h3>
            {choiceGroup(labels.storage, `${formId}-storage`, choicesWith(storageChoices, variant?.storageGb ?? null), draft.storageGb, (storageGb) => update({ storageGb }), storageLabel)}
            {choiceGroup(labels.ram, `${formId}-ram`, choicesWith(ramChoices, variant?.ramGb ?? null), draft.ramGb, (ramGb) => update({ ramGb }), (gb) => `${gb} GB`)}
          </div>
        )}

        <div className="flex flex-col gap-5 border-t border-border pt-6 first:border-t-0 first:pt-0">
          <div className="flex flex-col gap-1">
            <h3 className={sectionTitle}>{labels.colorSection}</h3>
            <p className="text-xs text-muted">{labels.colorHint}</p>
          </div>

          {knownColors.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-muted">{labels.reuseColor}</span>
              <div className="flex flex-wrap gap-2">
                {knownColors.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    disabled={busy}
                    onClick={() => update({ color: s.color!, colorHex: s.colorHex ?? "" }, ["colorEn", "colorAr", "hex"])}
                    className="inline-flex h-9 items-center gap-2 rounded-full border border-border bg-surface ps-1.5 pe-3.5 text-sm transition-colors hover:border-foreground/40 pointer-coarse:h-11"
                  >
                    <span
                      aria-hidden
                      className="size-6 rounded-full ring-1 ring-foreground/15 ring-inset"
                      style={{ background: s.colorHex ?? "var(--background)" }}
                    />
                    {localized(s.color!, locale)}
                  </button>
                ))}
              </div>
            </div>
          )}

          <BilingualField
            label={labels.colorName}
            value={draft.color}
            languages={languages}
            disabled={busy}
            errors={{ en: errors.colorEn, ar: errors.colorAr }}
            onChange={(color) => update({ color }, ["colorEn", "colorAr"])}
          />

          <Field label={labels.swatch} error={errors.hex} hint={labels.swatchHint}>
            {(control) => (
              <div className="flex items-center gap-3">
                <label
                  className="relative size-12 shrink-0 cursor-pointer rounded-full ring-1 ring-foreground/15 ring-inset transition-shadow has-focus-visible:outline-2 has-focus-visible:outline-offset-3 has-focus-visible:outline-brand"
                  style={{
                    background: hexPattern.test(draft.colorHex)
                      ? draft.colorHex
                      : "repeating-conic-gradient(var(--border) 0 25%, var(--surface) 0 50%) 50% / 12px 12px",
                  }}
                >
                  <span className="sr-only">{labels.pickSwatch}</span>
                  <input
                    type="color"
                    value={hexPattern.test(draft.colorHex) ? draft.colorHex.toLowerCase() : "#1c1a4a"}
                    disabled={busy}
                    onChange={(event) => update({ colorHex: event.target.value.toUpperCase() }, ["hex"])}
                    className="absolute inset-0 size-full cursor-pointer opacity-0"
                  />
                </label>
                <div className="w-40">
                  <AdornedInput
                    {...control}
                    value={draft.colorHex}
                    placeholder="#1C1A4A"
                    maxLength={7}
                    disabled={busy}
                    onChange={(value) => {
                      const hex = value.trim().toUpperCase();
                      update({ colorHex: hex && !hex.startsWith("#") ? `#${hex}` : hex }, ["hex"]);
                    }}
                  />
                </div>
                {draft.colorHex && (
                  <button type="button" onClick={() => update({ colorHex: "" }, ["hex"])} disabled={busy} className={textLink}>
                    {labels.clearSwatch}
                  </button>
                )}
              </div>
            )}
          </Field>
        </div>

        <div className="flex flex-col gap-5 border-t border-border pt-6">
          <h3 className={sectionTitle}>{labels.pricingSection}</h3>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label={labels.price} hint={labels.priceHint} error={errors.price}>
              {(control) => (
                <AdornedInput
                  {...control}
                  inputMode="decimal"
                  value={draft.price}
                  suffix={unit}
                  placeholder="0"
                  disabled={busy}
                  onChange={(price) => update({ price }, ["price", "compareAt"])}
                />
              )}
            </Field>
            <Field
              label={labels.compareAtPrice}
              note={labels.optional}
              hint={labels.compareAtHint}
              error={errors.compareAt}
              aside={discount !== null && <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent">{t(labels.discount, { percent: discount })}</span>}
            >
              {(control) => (
                <AdornedInput
                  {...control}
                  inputMode="decimal"
                  value={draft.compareAtPrice}
                  suffix={unit}
                  disabled={busy}
                  onChange={(compareAtPrice) => update({ compareAtPrice }, ["compareAt"])}
                />
              )}
            </Field>
          </div>
        </div>

        <div className="flex flex-col gap-5 border-t border-border pt-6">
          <h3 className={sectionTitle}>{labels.inventorySection}</h3>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label={labels.sku}
              hint={labels.skuHint}
              error={errors.sku}
              aside={
                draft.skuTouched && (
                  <button type="button" onClick={() => update({ sku: "", skuTouched: false }, ["sku"])} disabled={busy} className="text-xs font-medium text-brand hover:underline">
                    {labels.suggest}
                  </button>
                )
              }
            >
              {(control) => (
                <AdornedInput
                  {...control}
                  value={sku}
                  maxLength={productLimits.skuMax}
                  disabled={busy}
                  className="font-mono uppercase"
                  onChange={(value) => update({ sku: value.toUpperCase(), skuTouched: true }, ["sku"])}
                />
              )}
            </Field>
            {editing ? (
              <div className="flex flex-col justify-center rounded-2xl border border-border bg-background/60 px-4 py-3.5">
                <Switch checked={draft.isActive} onChange={(isActive) => update({ isActive })} label={labels.activeLabel} description={labels.activeHint} disabled={busy} />
              </div>
            ) : (
              <Field label={labels.initialStock} hint={labels.initialStockHint} error={errors.stock}>
                {(control) => (
                  <AdornedInput {...control} inputMode="numeric" value={draft.stock} suffix={labels.unitsSuffix} disabled={busy} onChange={(stock) => update({ stock }, ["stock"])} />
                )}
              </Field>
            )}
          </div>
        </div>
      </form>
    </AdminDialog>
  );
}
