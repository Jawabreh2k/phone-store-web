"use client";

import Image from "next/image";
import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { flushSync } from "react-dom";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import * as adminApi from "@/lib/api/admin-client";
import type { AdminSettings, LocalizedText, UpdateSettingsRequest } from "@/lib/api/types";
import { apiErrorMessage } from "@/lib/admin-errors";
import { acceptedImageTypes, apiFieldErrors, formatNumberInput, hasMoneyPrecision, localized, parseNumber, productLimits } from "@/lib/admin-products";
import { currencyLabel, formatPrice, t } from "@/lib/format";
import { useAdminAction, useUnsavedChangesWarning } from "@/lib/use-admin-action";
import { AdornedInput, BilingualField, Field, SelectField, Switch } from "./admin-form-controls";
import { AdminSection, SaveBar } from "./admin-section";
import { AlertIcon, CashIcon, ChatIcon, CoinsIcon, StoreIcon, TrashIcon, TruckIcon, UploadIcon } from "./icons";
import { StoreLogo } from "./store-logo";
import { buttonGhost, buttonSecondary, fieldInput, notice, panel } from "./ui";

interface Props {
  locale: Locale;
  settings: AdminSettings;
  labels: Dictionary["admin"]["settings"];
  saveBarLabels: Dictionary["admin"]["saveBar"];
  languages: Dictionary["admin"]["languages"];
  /** The storefront's own delivery sentences, so the preview reads exactly like the store. */
  deliveryLabels: Pick<Dictionary["home"], "promiseDeliveryFree" | "promiseDeliveryFlat" | "promiseDeliveryAlwaysFree">;
}

interface Draft {
  storeName: LocalizedText;
  supportPhone: string;
  whatsAppNumber: string;
  supportEmail: string;
  currencyCode: string;
  phoneCountryCode: string;
  timeZoneId: string;
  flatShippingFee: string;
  freeShipping: boolean;
  freeShippingThreshold: string;
  allowGuestCheckout: boolean;
}

type FieldKey =
  | "storeName.en"
  | "storeName.ar"
  | "supportPhone"
  | "whatsAppNumber"
  | "supportEmail"
  | "currencyCode"
  | "phoneCountryCode"
  | "timeZoneId"
  | "flatShippingFee"
  | "freeShippingThreshold";
type FieldErrors = Partial<Record<FieldKey, string>>;

const fieldKeys = new Set<string>(["storeName.en", "storeName.ar", "supportPhone", "whatsAppNumber", "supportEmail", "currencyCode", "phoneCountryCode", "timeZoneId", "flatShippingFee", "freeShippingThreshold"]);
const storeNameMax = 80;

/** Currencies of the region first; the current one is always offered even if it isn't listed. */
const currencyChoices = ["JOD", "ILS", "SAR", "AED", "KWD", "QAR", "BHD", "OMR", "EGP", "IQD", "USD", "EUR"];

const timezoneChoices = [
  "Asia/Amman",
  "Asia/Hebron",
  "Asia/Jerusalem",
  "Asia/Riyadh",
  "Asia/Dubai",
  "Asia/Kuwait",
  "Asia/Qatar",
  "Asia/Bahrain",
  "Asia/Muscat",
  "Asia/Baghdad",
  "Africa/Cairo",
  "Europe/London",
  "UTC",
];

/**
 * "Hebron (GMT+3)". The city comes from the dictionary: Intl's generic names can't tell these zones apart (five
 * are "Arabian Standard Time", and Hebron and Cairo are both "Eastern European Time").
 */
function timezoneLabel(id: string, locale: Locale, cities: Record<string, string>): string {
  const city = cities[id] ?? id;
  try {
    const offset = new Intl.DateTimeFormat(locale === "ar" ? "ar-u-nu-latn" : "en", { timeZone: id, timeZoneName: "shortOffset" })
      .formatToParts(new Date())
      .find((part) => part.type === "timeZoneName")?.value;
    return offset ? `${city} (${offset})` : city;
  } catch {
    return city;
  }
}

function timezoneOptions(current: string, locale: Locale, cities: Record<string, string>) {
  const ids = timezoneChoices.includes(current) ? timezoneChoices : [current, ...timezoneChoices];
  return ids.map((id) => ({ value: id, label: timezoneLabel(id, locale, cities) }));
}

function draftFrom(s: AdminSettings): Draft {
  return {
    storeName: s.storeName,
    supportPhone: s.supportPhone ?? "",
    whatsAppNumber: s.whatsAppNumber ?? "",
    supportEmail: s.supportEmail ?? "",
    currencyCode: s.currencyCode,
    phoneCountryCode: s.phoneCountryCode,
    timeZoneId: s.timeZoneId,
    flatShippingFee: formatNumberInput(s.flatShippingFee),
    freeShipping: s.freeShippingThreshold !== null,
    freeShippingThreshold: formatNumberInput(s.freeShippingThreshold),
    allowGuestCheckout: s.allowGuestCheckout,
  };
}

/** Digits typed on an Arabic keyboard become Latin ones; anything else is left for validation to reject. */
const latinDigits = (text: string) => text.trim().replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660));

function toRequest(d: Draft): UpdateSettingsRequest {
  return {
    storeName: { en: d.storeName.en.trim(), ar: d.storeName.ar.trim() },
    supportPhone: d.supportPhone.trim() || null,
    whatsAppNumber: d.whatsAppNumber.trim() || null,
    supportEmail: d.supportEmail.trim() || null,
    currencyCode: d.currencyCode,
    phoneCountryCode: latinDigits(d.phoneCountryCode).replace(/^\+/, ""),
    timeZoneId: d.timeZoneId,
    flatShippingFee: parseNumber(d.flatShippingFee),
    freeShippingThreshold: d.freeShipping ? parseNumber(d.freeShippingThreshold) : null,
    allowGuestCheckout: d.allowGuestCheckout,
  };
}

function validate(d: Draft, labels: Props["labels"]): FieldErrors {
  const errors: FieldErrors = {};
  const request = toRequest(d);
  for (const language of ["en", "ar"] as const) {
    const value = request.storeName[language];
    if (!value) errors[`storeName.${language}`] = labels.fieldErrors.required;
    else if (value.length > storeNameMax) errors[`storeName.${language}`] = t(labels.fieldErrors.tooLong, { max: storeNameMax });
  }
  if (request.supportEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(request.supportEmail)) errors.supportEmail = labels.fieldErrors.email;
  if (!(request.flatShippingFee >= 0) || !hasMoneyPrecision(request.flatShippingFee)) errors.flatShippingFee = labels.fieldErrors.money;
  if (request.freeShippingThreshold !== null && (!(request.freeShippingThreshold >= 0) || !hasMoneyPrecision(request.freeShippingThreshold))) {
    errors.freeShippingThreshold = labels.fieldErrors.money;
  }
  if (!/^[1-9]\d{0,2}$/.test(request.phoneCountryCode)) errors.phoneCountryCode = labels.fieldErrors.countryCode;
  return errors;
}

/** A price in a currency staff may still be typing; falls back to the saved currency until the code is valid. */
function safePrice(amount: number, currency: string, fallback: string, locale: Locale): string {
  try {
    return formatPrice(amount, currency, locale);
  } catch {
    return formatPrice(amount, fallback, locale);
  }
}

/** Store settings: identity, contact, delivery, checkout and region, saved together, with a live preview. */
export function AdminSettingsForm({ locale, settings, labels, saveBarLabels, languages, deliveryLabels }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [baseline, setBaseline] = useState(() => draftFrom(settings));
  const [draft, setDraft] = useState(baseline);
  const [logoUrl, setLogoUrl] = useState(settings.logoUrl);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const { run, busy, saved } = useAdminAction(locale, { storefront: "settings" });

  const dirty = JSON.stringify(toRequest(draft)) !== JSON.stringify(toRequest(baseline));
  useUnsavedChangesWarning(dirty);

  const update = (changes: Partial<Draft>, cleared: FieldKey[] = []) => {
    setDraft((current) => ({ ...current, ...changes }));
    if (cleared.some((key) => errors[key])) {
      const next = { ...errors };
      for (const key of cleared) delete next[key];
      setErrors(next);
      if (Object.keys(next).length === 0) setFormError(null);
    }
  };

  const showErrors = (found: FieldErrors) => {
    flushSync(() => {
      setErrors(found);
      setFormError(labels.fixErrors);
    });
    formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;

    const found = validate(draft, labels);
    if (Object.keys(found).length > 0) return showErrors(found);
    setErrors({});
    setFormError(null);

    const result = await run(() => adminApi.updateSettings(locale, toRequest(draft)));
    if (result.ok) return setBaseline(draft);

    const serverFields = apiFieldErrors(result.error);
    const mapped: FieldErrors = {};
    for (const key of Object.keys(serverFields ?? {})) {
      if (!fieldKeys.has(key)) continue;
      mapped[key as FieldKey] = key === "supportPhone" || key === "whatsAppNumber" ? labels.fieldErrors.phone : labels.fieldErrors.invalid;
    }
    if (Object.keys(mapped).length > 0) showErrors(mapped);
    else setFormError(apiErrorMessage(result.error, labels.errors));
  };

  const discard = () => {
    setDraft(baseline);
    setErrors({});
    setFormError(null);
  };

  // ---- Derived for hints and the preview ----

  const currency = /^[A-Z]{3}$/.test(draft.currencyCode) ? draft.currencyCode : settings.currencyCode;
  const unit = currencyLabel(currency, locale);
  // While a number is half-typed, the preview keeps the last saved value rather than flickering to "free".
  const typedFee = parseNumber(draft.flatShippingFee);
  const fee = Number.isNaN(typedFee) ? settings.flatShippingFee : typedFee;
  const typedThreshold = parseNumber(draft.freeShippingThreshold);
  const threshold = !draft.freeShipping ? null : Number.isNaN(typedThreshold) ? settings.freeShippingThreshold : typedThreshold;
  const price = (amount: number) => safePrice(amount, currency, settings.currencyCode, locale);
  const deliveryLine =
    fee === 0 || threshold === 0
      ? deliveryLabels.promiseDeliveryAlwaysFree
      : threshold !== null
        ? t(deliveryLabels.promiseDeliveryFree, { amount: price(threshold), fee: price(fee) })
        : t(deliveryLabels.promiseDeliveryFlat, { fee: price(fee) });

  const currencyNames = new Intl.DisplayNames([locale], { type: "currency" });
  const currencyOptions = [...new Set([...currencyChoices, settings.currencyCode])].map((code) => ({
    value: code,
    label: `${currencyNames.of(code) ?? code} (${code})`,
  }));

  const phoneField = (key: "supportPhone" | "whatsAppNumber", label: string, hint: string) => (
    <Field label={label} note={labels.optional} hint={hint} error={errors[key]}>
      {(control) => (
        <input
          {...control}
          type="tel"
          dir="ltr"
          autoComplete="off"
          inputMode="tel"
          placeholder="079 123 4567"
          value={draft[key]}
          disabled={busy}
          onChange={(event) => update({ [key]: event.target.value }, [key])}
          className={`${fieldInput} text-start`}
        />
      )}
    </Field>
  );

  return (
    <form ref={formRef} noValidate onSubmit={submit} className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:gap-8 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="flex min-w-0 flex-col gap-6">
        <AdminSection id="store" title={labels.storeSection} description={labels.storeDescription} icon={<StoreIcon />}>
          <div className="flex flex-col gap-6">
            <BilingualField
              label={labels.storeName}
              hint={labels.storeNameHint}
              value={draft.storeName}
              languages={languages}
              disabled={busy}
              errors={{ en: errors["storeName.en"], ar: errors["storeName.ar"] }}
              onChange={(storeName) => update({ storeName }, ["storeName.en", "storeName.ar"])}
            />
            <div className="border-t border-border pt-6">
              <LogoField locale={locale} logoUrl={logoUrl} storeName={localized(draft.storeName, locale)} onChange={setLogoUrl} labels={labels} />
            </div>
          </div>
        </AdminSection>

        <AdminSection id="contact" title={labels.contactSection} description={labels.contactDescription} icon={<ChatIcon />}>
          <div className="flex flex-col gap-5">
            <div className="grid gap-5 sm:grid-cols-2">
              {phoneField("supportPhone", labels.supportPhone, labels.supportPhoneHint)}
              {phoneField("whatsAppNumber", labels.whatsApp, labels.whatsAppHint)}
            </div>
            <Field label={labels.email} note={labels.optional} error={errors.supportEmail}>
              {(control) => (
                <input
                  {...control}
                  type="email"
                  dir="ltr"
                  autoComplete="off"
                  placeholder="help@example.com"
                  value={draft.supportEmail}
                  disabled={busy}
                  onChange={(event) => update({ supportEmail: event.target.value }, ["supportEmail"])}
                  className={`${fieldInput} text-start`}
                />
              )}
            </Field>
          </div>
        </AdminSection>

        <AdminSection id="delivery" title={labels.deliverySection} description={labels.deliveryDescription} icon={<TruckIcon />}>
          <div className="flex flex-col gap-5">
            <Field label={labels.deliveryFee} hint={labels.deliveryFeeHint} error={errors.flatShippingFee} className="sm:max-w-xs">
              {(control) => (
                <AdornedInput
                  {...control}
                  inputMode="decimal"
                  value={draft.flatShippingFee}
                  suffix={unit}
                  disabled={busy}
                  onChange={(flatShippingFee) => update({ flatShippingFee }, ["flatShippingFee"])}
                />
              )}
            </Field>
            <div className="flex flex-col gap-4 rounded-2xl border border-border bg-background/60 p-4">
              <Switch
                checked={draft.freeShipping}
                onChange={(freeShipping) => update({ freeShipping }, ["freeShippingThreshold"])}
                label={labels.freeDelivery}
                description={labels.freeDeliveryHint}
                disabled={busy}
              />
              {draft.freeShipping && (
                <Field label={labels.threshold} error={errors.freeShippingThreshold} className="sm:max-w-xs">
                  {(control) => (
                    <AdornedInput
                      {...control}
                      inputMode="decimal"
                      value={draft.freeShippingThreshold}
                      suffix={unit}
                      placeholder="100"
                      disabled={busy}
                      onChange={(freeShippingThreshold) => update({ freeShippingThreshold }, ["freeShippingThreshold"])}
                    />
                  )}
                </Field>
              )}
            </div>
          </div>
        </AdminSection>

        <AdminSection id="checkout" title={labels.checkoutSection} description={labels.checkoutDescription} icon={<CashIcon />}>
          <div className="flex flex-col gap-4">
            <Switch
              checked={draft.allowGuestCheckout}
              onChange={(allowGuestCheckout) => update({ allowGuestCheckout })}
              label={labels.guestCheckout}
              description={labels.guestCheckoutHint}
              disabled={busy}
            />
            {!draft.allowGuestCheckout && (
              <p role="status" className={notice}>
                <AlertIcon />
                {labels.guestCheckoutOff}
              </p>
            )}
          </div>
        </AdminSection>

        <AdminSection id="region" title={labels.regionSection} description={labels.regionDescription} icon={<CoinsIcon />}>
          <div className="flex flex-col gap-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label={labels.currency} error={errors.currencyCode}>
                {(control) => (
                  <SelectField {...control} value={draft.currencyCode} options={currencyOptions} disabled={busy} onChange={(currencyCode) => update({ currencyCode }, ["currencyCode"])} />
                )}
              </Field>
              <Field label={labels.countryCode} hint={labels.countryCodeHint} error={errors.phoneCountryCode}>
                {(control) => (
                  <AdornedInput
                    {...control}
                    inputMode="numeric"
                    prefix="+"
                    value={draft.phoneCountryCode}
                    maxLength={4}
                    disabled={busy}
                    onChange={(phoneCountryCode) => update({ phoneCountryCode }, ["phoneCountryCode"])}
                  />
                )}
              </Field>
            </div>
            <Field label={labels.timeZone} hint={labels.timeZoneHint} error={errors.timeZoneId}>
              {(control) => (
                <SelectField
                  {...control}
                  value={draft.timeZoneId}
                  options={timezoneOptions(draft.timeZoneId, locale, labels.timeZones)}
                  disabled={busy}
                  onChange={(timeZoneId) => update({ timeZoneId }, ["timeZoneId"])}
                />
              )}
            </Field>
            {draft.currencyCode !== baseline.currencyCode && (
              <p role="status" className={notice}>
                <AlertIcon />
                {t(labels.currencyChanged, { from: baseline.currencyCode, to: draft.currencyCode })}
              </p>
            )}
          </div>
        </AdminSection>

        <SaveBar dirty={dirty} busy={busy} saved={saved} error={formError} onDiscard={discard} labels={saveBarLabels} />
      </div>

      <aside aria-label={labels.preview} className={`${panel} flex flex-col gap-5 p-5 lg:sticky lg:top-6`}>
        <h2 className="text-sm font-semibold">{labels.preview}</h2>
        <PreviewRow label={labels.previewHeader}>
          <div className="flex h-12 items-center justify-between rounded-full border border-border bg-surface ps-4 pe-2 shadow-lift">
            <StoreLogo storeName={localized(draft.storeName, locale)} logoUrl={logoUrl} />
            <span aria-hidden className="h-8 w-14 rounded-full bg-brand" />
          </div>
        </PreviewRow>
        <PreviewRow label={labels.previewBanner}>
          <div className="flex h-12 items-center rounded-2xl bg-brand ps-4 text-brand-foreground">
            <StoreLogo storeName={localized(draft.storeName, locale)} logoUrl={logoUrl} inverse />
          </div>
        </PreviewRow>
        <PreviewRow label={labels.previewDelivery}>
          <p className="flex items-start gap-2.5 text-sm leading-relaxed">
            <TruckIcon className="mt-0.5 size-4 shrink-0 text-muted" />
            <span>{deliveryLine}</span>
          </p>
        </PreviewRow>
        {(draft.whatsAppNumber.trim() || draft.supportPhone.trim()) && (
          <PreviewRow label={labels.previewContact}>
            <p className="flex items-center gap-2.5 text-sm">
              <ChatIcon className="size-4 shrink-0 text-muted" />
              <bdi dir="ltr">{draft.whatsAppNumber.trim() || draft.supportPhone.trim()}</bdi>
            </p>
          </PreviewRow>
        )}
      </aside>
    </form>
  );
}

function PreviewRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2 border-t border-border pt-4 first-of-type:border-t-0 first-of-type:pt-0">
      <span className="text-xs text-muted">{label}</span>
      {children}
    </div>
  );
}

interface LogoFieldProps {
  locale: Locale;
  logoUrl: string | null;
  storeName: string;
  onChange: (url: string | null) => void;
  labels: Dictionary["admin"]["settings"];
}

/** Uploads or removes the logo straight away (it isn't part of the form's save), and shows it as the header will. */
function LogoField({ locale, logoUrl, storeName, onChange, labels }: LogoFieldProps) {
  const { run, busy } = useAdminAction(locale, { storefront: "settings" });
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File | undefined) => {
    if (!file) return;
    if (!(acceptedImageTypes as readonly string[]).includes(file.type)) return setError(labels.errors["files.unsupported_type"]);
    if (file.size > productLimits.imageMaxBytes) return setError(labels.errors["files.too_large"]);
    setError(null);
    const result = await run(() => adminApi.uploadStoreLogo(locale, file), { refresh: false });
    if (result.ok) onChange(result.value);
    else setError(apiErrorMessage(result.error, labels.errors));
  };

  const remove = async () => {
    setError(null);
    const result = await run(() => adminApi.removeStoreLogo(locale), { refresh: false });
    if (result.ok) onChange(null);
    else setError(apiErrorMessage(result.error, labels.errors));
  };

  return (
    <div className="flex flex-col gap-3">
      <span className="text-sm font-medium">{labels.logo}</span>
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex h-20 w-44 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-[repeating-conic-gradient(var(--border)_0_25%,var(--surface)_0_50%)] bg-[length:14px_14px]">
          {logoUrl ? (
            <Image src={logoUrl} alt={storeName} fill unoptimized className="object-contain p-3" />
          ) : (
            <span className="px-3 text-center text-xs text-muted">{labels.logoNone}</span>
          )}
          {busy && <span aria-hidden className="absolute inset-0 flex items-center justify-center bg-surface/70"><span className="size-6 rounded-full border-2 border-brand/20 border-t-brand motion-safe:animate-spin" /></span>}
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <label className={`${buttonSecondary} cursor-pointer has-disabled:cursor-not-allowed has-disabled:opacity-50 has-focus-visible:outline-2 has-focus-visible:outline-offset-3 has-focus-visible:outline-brand`}>
              <UploadIcon />
              {busy ? labels.logoUploading : logoUrl ? labels.logoReplace : labels.logoUpload}
              <input
                type="file"
                accept={acceptedImageTypes.join(",")}
                disabled={busy}
                className="sr-only"
                onChange={(event) => {
                  void upload(event.target.files?.[0]);
                  event.target.value = "";
                }}
              />
            </label>
            {logoUrl && (
              <button type="button" onClick={() => void remove()} disabled={busy} className={buttonGhost}>
                <TrashIcon />
                {labels.logoRemove}
              </button>
            )}
          </div>
          <p className="max-w-sm text-xs leading-relaxed text-muted">{labels.logoHint}</p>
        </div>
      </div>
      {error && (
        <p role="alert" className="text-sm text-accent">
          {error}
        </p>
      )}
    </div>
  );
}
