"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { CartLoadError } from "@/components/cart-load-error";
import { useCart } from "@/components/cart-provider";
import { Fill } from "@/components/fill";
import { AlertIcon, CashIcon, CheckIcon, ChevronDownIcon } from "@/components/icons";
import { ProductImagePlaceholder } from "@/components/product-image-placeholder";
import { VariantLabel } from "@/components/variant-label";
import { CheckoutPageSkeleton } from "@/components/skeletons";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import * as cartApi from "@/lib/api/client";
import { ApiError } from "@/lib/api/types";
import { checkoutErrorMessage, checkoutRedirectNotice, mapFieldErrors } from "@/lib/checkout-errors";
import { formatPrice, plural } from "@/lib/format";
import {
  buttonPrimary,
  fieldGroup,
  fieldHint,
  fieldInput,
  fieldLabel,
  formSection,
  formSectionTitle,
  notice as noticeBox,
  panel,
  panelTitle,
} from "@/components/ui";

interface Props {
  locale: Locale;
  labels: Dictionary["checkout"];
  cartLabels: Dictionary["cart"];
}

type FieldKey = "fullName" | "phone" | "email" | "city" | "area" | "street" | "building" | "details" | "note";

const apiFieldMap: Record<FieldKey, string> = {
  fullName: "fullName",
  phone: "phone",
  email: "email",
  city: "address.city",
  area: "address.area",
  street: "address.street",
  building: "address.building",
  details: "address.details",
  note: "note",
};

const requiredFields = new Set<FieldKey>(["fullName", "phone", "city", "area", "street"]);
const fieldOrder: FieldKey[] = ["fullName", "phone", "email", "city", "area", "street", "building", "details", "note"];

export function CheckoutForm({ locale, labels, cartLabels }: Props) {
  const router = useRouter();
  const { cart, status, refresh } = useCart();
  const ready = status === "ready";
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const formRef = useRef<HTMLFormElement>(null);
  // Blocks a second submit before React re-renders. State alone loses that race, and the losing
  // request's redirect can leave the page before the customer sees their tracking link.
  const submittingRef = useRef(false);
  // Set once an order succeeds: the cart then empties, and the empty-cart redirect below must not
  // replace the navigation to the track page (the one place the customer sees their tracking link).
  const placedRef = useRef(false);
  // The server cart is empty but this page must stay up: the order may already exist, and leaving
  // for "your cart was empty" would hide that.
  const keepCheckoutRef = useRef(false);

  useEffect(() => {
    if (ready && !placedRef.current && !keepCheckoutRef.current && (!cart || cart.lines.length === 0)) {
      router.replace(`/${locale}/cart?notice=empty`);
    }
  }, [ready, cart, locale, router]);

  const focusFirstInvalid = (errors: Partial<Record<FieldKey, string>>) => {
    const first = fieldOrder.find((key) => errors[key]);
    if (!first) return;
    requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>(`#${first}`)?.focus());
  };

  const fieldMessage = (key: FieldKey) => {
    const apiKey = apiFieldMap[key];
    return apiKey in labels.fieldErrors ? labels.fieldErrors[apiKey as keyof typeof labels.fieldErrors] : labels.fieldErrors.generic;
  };

  if (status === "error" && !placedRef.current) {
    return <CartLoadError labels={cartLabels} onRetry={refresh} />;
  }

  if (keepCheckoutRef.current && (!cart || cart.lines.length === 0)) {
    return (
      <p className={noticeBox} role="alert">
        <AlertIcon />
        {formError ?? labels.errors.orderMaybePlaced}
      </p>
    );
  }

  if (!ready || !cart || cart.lines.length === 0) {
    return (
      <div aria-busy="true">
        <CheckoutPageSkeleton />
      </div>
    );
  }

  const clearFieldError = (field: FieldKey) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const applyFieldErrors = (errors: Partial<Record<FieldKey, string>>) => {
    setFieldErrors(errors);
    setFormError(labels.errors.validation);
    focusFirstInvalid(errors);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submittingRef.current || placedRef.current) return;
    submittingRef.current = true;

    setSubmitting(true);
    setFormError(null);
    setFieldErrors({});

    const data = new FormData(event.currentTarget);
    const missing: Partial<Record<FieldKey, string>> = {};
    for (const key of requiredFields) {
      if (!String(data.get(key) ?? "").trim()) missing[key] = fieldMessage(key);
    }
    if (Object.keys(missing).length > 0) {
      applyFieldErrors(missing);
      submittingRef.current = false;
      setSubmitting(false);
      return;
    }

    try {
      const placed = await cartApi.placeOrder(locale, {
        fullName: String(data.get("fullName") ?? "").trim(),
        phone: String(data.get("phone") ?? "").trim(),
        email: String(data.get("email") ?? "").trim() || null,
        address: {
          city: String(data.get("city") ?? "").trim(),
          area: String(data.get("area") ?? "").trim(),
          street: String(data.get("street") ?? "").trim(),
          building: String(data.get("building") ?? "").trim() || null,
          details: String(data.get("details") ?? "").trim() || null,
        },
        note: String(data.get("note") ?? "").trim() || null,
        saveAddress: false,
      });

      placedRef.current = true;
      router.replace(`/${locale}/orders/track/${placed.trackingToken}?placed=1`);
      // Silent: a failed reload must not flip the page into the cart error after the order exists.
      void refresh({ silent: true });
      return;
    } catch (error) {
      if (placedRef.current) return;

      if (error instanceof ApiError && error.problem.code === "cart.empty") {
        keepCheckoutRef.current = true;
        await refresh({ silent: true });
        if (placedRef.current) return;
        setFormError(labels.errors.orderMaybePlaced);
        return;
      }

      if (!(error instanceof ApiError)) {
        keepCheckoutRef.current = true;
        const latest = await refresh({ silent: true });
        if (placedRef.current) return;
        const emptied = latest.ok && (latest.cart === null || latest.cart.lines.length === 0);
        if (emptied) {
          setFormError(labels.errors.orderMaybePlaced);
          return;
        }
        keepCheckoutRef.current = false;
        setFormError(labels.errors.generic);
        return;
      }

      const notice = checkoutRedirectNotice(error.problem.code);
      if (notice) {
        await refresh();
        if (placedRef.current) return;
        router.replace(`/${locale}/cart?notice=${notice}`);
        return;
      }

      if (error.problem.code === "validation" && error.problem.errors) {
        const mapped = mapFieldErrors(error.problem.errors, labels.fieldErrors);
        const local: Partial<Record<FieldKey, string>> = {};
        for (const [field, message] of Object.entries(mapped)) {
          const localKey = (Object.entries(apiFieldMap).find(([, apiKey]) => apiKey === field)?.[0] ?? field) as FieldKey;
          local[localKey] = message;
        }
        applyFieldErrors(local);
        return;
      }

      if (error.problem.code === "orders.guest_checkout_disabled") {
        setFormError(labels.errors["orders.guest_checkout_disabled"]);
        return;
      }

      setFormError(checkoutErrorMessage(error, labels.errors));
    } finally {
      // After a successful order the button stays disabled until the track page replaces this form.
      if (!placedRef.current) {
        submittingRef.current = false;
        setSubmitting(false);
      }
    }
  };

  const field = (name: FieldKey, label: string, options?: { type?: string; dir?: "ltr" | "rtl"; optional?: boolean }) => (
    <div className={fieldGroup}>
      <label htmlFor={name} className={fieldLabel}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={options?.type ?? "text"}
        dir={options?.dir}
        autoComplete={
          name === "fullName"
            ? "name"
            : name === "phone"
              ? "tel"
              : name === "email"
                ? "email"
                : name === "city"
                  ? "address-level2"
                  : name === "street"
                    ? "street-address"
                    : undefined
        }
        required={requiredFields.has(name)}
        aria-required={requiredFields.has(name) || undefined}
        aria-invalid={fieldErrors[name] ? true : undefined}
        aria-describedby={fieldErrors[name] ? `${name}-error` : undefined}
        disabled={submitting}
        onChange={() => clearFieldError(name)}
        className={fieldInput}
      />
      {fieldErrors[name] && (
        <p id={`${name}-error`} className={fieldHint} role="alert">
          {fieldErrors[name]}
        </p>
      )}
    </div>
  );

  const checkoutBlocked = cart.hasUnavailableItems;
  const money = (amount: number) => formatPrice(amount, cart.currencyCode, locale);
  const itemCount = plural(cartLabels.itemCount, cart.itemCount, locale);

  // Numbered like the steps a customer goes through; the number is decoration next to the real heading text.
  const sectionTitle = (n: number, title: string) => (
    <h2 className={`${formSectionTitle} flex items-center gap-3`}>
      <span aria-hidden className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-semibold text-brand-foreground">
        {n}
      </span>
      {title}
    </h2>
  );

  const lines = (
    <ul className="flex flex-col gap-3">
      {cart.lines.map((line) => (
        <li key={line.variantId} className="flex gap-3">
          <div className="relative aspect-square w-14 shrink-0 overflow-hidden rounded-xl bg-background">
            {line.imageUrl ? (
              <Image src={line.imageUrl} alt={line.productName} fill sizes="3.5rem" className="object-contain p-1" />
            ) : (
              <ProductImagePlaceholder name={line.productName} />
            )}
          </div>
          <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{line.productName}</p>
              <p className="text-xs text-muted">
                <VariantLabel label={line.variantLabel} /> × {line.quantity}
              </p>
            </div>
            <bdi className="shrink-0 text-sm font-medium tabular-nums">{money(line.lineTotal)}</bdi>
          </div>
        </li>
      ))}
    </ul>
  );

  return (
    <form ref={formRef} noValidate onSubmit={submit} className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:items-start lg:gap-12">
      <div className="flex flex-col gap-5">
        {/* Phones: what is being ordered, before the form (the full summary sits beside it on desktop). */}
        <details className={`${panel} group lg:hidden`}>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-card px-5 py-4 [&::-webkit-details-marker]:hidden">
            <span className="flex flex-col">
              <span className="font-semibold">{labels.showSummary}</span>
              <span className="text-sm text-muted">{itemCount}</span>
            </span>
            <span className="flex items-center gap-2">
              <bdi className="font-semibold tabular-nums">{money(cart.total)}</bdi>
              <ChevronDownIcon className="size-4 text-muted transition-transform group-open:rotate-180" />
            </span>
          </summary>
          <div className="border-t border-border px-5 py-4">{lines}</div>
        </details>

        {cart.hasUnavailableItems && (
          <p className={noticeBox} role="status">
            <AlertIcon />
            {cartLabels.unavailableWarning}
          </p>
        )}

        {formError && (
          <p className={noticeBox} role="alert">
            <AlertIcon />
            {formError}
          </p>
        )}

        <section className={formSection}>
          {sectionTitle(1, labels.contactSection)}
          {field("fullName", labels.fullName)}
          {field("phone", labels.phone, { type: "tel", dir: "ltr" })}
          {field("email", labels.email, { type: "email", dir: "ltr" })}
        </section>

        <section className={formSection}>
          {sectionTitle(2, labels.addressSection)}
          <div className="grid gap-4 sm:grid-cols-2">
            {field("city", labels.city)}
            {field("area", labels.area)}
          </div>
          {field("street", labels.street)}
          <div className="grid gap-4 sm:grid-cols-2">
            {field("building", labels.building)}
            {field("details", labels.details)}
          </div>
          <div className={`${fieldGroup} border-t border-border pt-4`}>
            <label htmlFor="note" className={fieldLabel}>
              {labels.note}
            </label>
            <textarea
              id="note"
              name="note"
              rows={3}
              disabled={submitting}
              aria-invalid={fieldErrors.note ? true : undefined}
              aria-describedby={fieldErrors.note ? "note-error" : undefined}
              onChange={() => clearFieldError("note")}
              className={fieldInput}
            />
            {fieldErrors.note && (
              <p id="note-error" className={fieldHint} role="alert">
                {fieldErrors.note}
              </p>
            )}
          </div>
        </section>

        <section className={formSection}>
          {sectionTitle(3, labels.paymentSection)}
          {/* The only payment method, shown as the chosen one so the customer knows exactly what to expect. */}
          <div className="flex items-start gap-4 rounded-2xl border-2 border-brand bg-brand/5 p-4">
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-success text-brand-foreground">
              <CashIcon className="size-[1.125rem]" />
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <p className="font-semibold">{labels.cashOnDelivery}</p>
              <p className="text-sm leading-relaxed text-muted">
                <Fill template={labels.codDetail} values={{ total: <bdi className="font-medium text-foreground">{money(cart.total)}</bdi> }} />
              </p>
            </div>
            <CheckIcon className="size-5 shrink-0 text-brand" />
          </div>
        </section>
      </div>

      <aside className={`${panel} flex flex-col gap-5 p-5 sm:p-6 lg:sticky lg:top-28`}>
        <div className="hidden flex-col gap-5 lg:flex">
          <h2 className={panelTitle}>{labels.orderSummary}</h2>
          <div className="border-b border-border pb-5">{lines}</div>
        </div>

        <dl className="flex flex-col gap-3 text-sm">
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-muted">{cartLabels.subtotal}</dt>
            <dd className="font-medium tabular-nums">
              <bdi>{money(cart.subtotal)}</bdi>
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-muted">{cartLabels.shipping}</dt>
            <dd className="font-medium tabular-nums">
              {cart.shippingFee === 0 ? <span className="text-success">{cartLabels.free}</span> : <bdi>{money(cart.shippingFee)}</bdi>}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 border-t border-border pt-3 text-base">
            <dt className="font-semibold">{cartLabels.total}</dt>
            <dd className="text-xl font-semibold tracking-tight tabular-nums">
              <bdi>{money(cart.total)}</bdi>
            </dd>
          </div>
        </dl>

        <div className="flex flex-col gap-2.5">
          <button type="submit" disabled={submitting || checkoutBlocked} className={`${buttonPrimary} w-full`}>
            {submitting ? (
              labels.processing
            ) : (
              <>
                {labels.placeOrder}
                <span aria-hidden className="opacity-60">
                  ·
                </span>
                <bdi>{money(cart.total)}</bdi>
              </>
            )}
          </button>
          <p className="text-center text-xs text-muted">{labels.noPaymentNow}</p>
        </div>
      </aside>
    </form>
  );
}
