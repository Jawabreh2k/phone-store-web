"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { CartLoadError } from "@/components/cart-load-error";
import { useCart } from "@/components/cart-provider";
import { ProductImagePlaceholder } from "@/components/product-image-placeholder";
import { VariantLabel } from "@/components/variant-label";
import { CheckoutPageSkeleton } from "@/components/skeletons";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import * as cartApi from "@/lib/api/client";
import { ApiError } from "@/lib/api/types";
import { checkoutErrorMessage, checkoutRedirectNotice, mapFieldErrors } from "@/lib/checkout-errors";
import { formatPrice } from "@/lib/format";
import {
  buttonPrimary,
  fieldGroup,
  fieldHint,
  fieldInput,
  fieldLabel,
  formSection,
  formSectionTitle,
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

export function CheckoutForm({ locale, labels, cartLabels }: Props) {
  const router = useRouter();
  const { cart, status, refresh } = useCart();
  const ready = status === "ready";
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldKey, string>>>({});
  // Set once an order succeeds: the cart then empties, and the empty-cart redirect below must not
  // replace the navigation to the track page (the one place the customer sees their tracking link).
  const placedRef = useRef(false);

  useEffect(() => {
    if (ready && !placedRef.current && (!cart || cart.lines.length === 0)) {
      router.replace(`/${locale}/cart?notice=empty`);
    }
  }, [ready, cart, locale, router]);

  if (status === "error") {
    return <CartLoadError labels={cartLabels} onRetry={refresh} />;
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

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting || placedRef.current) return;

    setSubmitting(true);
    setFormError(null);
    setFieldErrors({});

    const data = new FormData(event.currentTarget);

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
      // The order is placed; a failed refresh only leaves the header count stale until the next load.
      void refresh();
      return;
    } catch (error) {
      if (error instanceof ApiError) {
        const notice = checkoutRedirectNotice(error.problem.code);
        if (notice) {
          await refresh();
          router.replace(`/${locale}/cart?notice=${notice}`);
          return;
        }

        if (error.problem.code === "validation" && error.problem.errors) {
          const mapped = mapFieldErrors(error.problem.errors, labels.fieldErrors);
          const local: Partial<Record<FieldKey, string>> = {};
          for (const [field, message] of Object.entries(mapped)) {
            const localKey = (Object.entries(apiFieldMap).find(([, apiKey]) => apiKey === field)?.[0] ??
              field) as FieldKey;
            local[localKey] = message;
          }
          setFieldErrors(local);
          setFormError(labels.errors.validation);
          return;
        }

        if (error.problem.code === "phone.invalid") {
          setFieldErrors({ phone: labels.errors["phone.invalid"] });
          return;
        }

        if (error.problem.code === "orders.guest_checkout_disabled") {
          setFormError(labels.errors["orders.guest_checkout_disabled"]);
          return;
        }
      }

      setFormError(checkoutErrorMessage(error, labels.errors));
    } finally {
      // After a successful order the button stays disabled until the track page replaces this form.
      if (!placedRef.current) setSubmitting(false);
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

  return (
    <form onSubmit={submit} className="flex flex-col gap-10 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:items-start lg:gap-16">
      <div className="flex flex-col gap-6">
        {cart.hasUnavailableItems && (
          <p className="rounded-2xl border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-accent" role="status">
            {cartLabels.unavailableWarning}
          </p>
        )}

        {formError && (
          <p className="rounded-2xl border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-accent" role="alert">
            {formError}
          </p>
        )}

        <section className={formSection}>
          <h2 className={formSectionTitle}>{labels.contactSection}</h2>
          {field("fullName", labels.fullName)}
          {field("phone", labels.phone, { type: "tel", dir: "ltr" })}
          {field("email", labels.email, { type: "email", dir: "ltr" })}
        </section>

        <section className={formSection}>
          <h2 className={formSectionTitle}>{labels.addressSection}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {field("city", labels.city)}
            {field("area", labels.area)}
          </div>
          {field("street", labels.street)}
          {field("building", labels.building)}
          {field("details", labels.details)}
        </section>

        <section className={formSection}>
          <div className={fieldGroup}>
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
          <h2 className={formSectionTitle}>{labels.paymentSection}</h2>
          <p className="text-sm text-muted">{labels.cashOnDelivery}</p>
        </section>
      </div>

      <aside className="flex flex-col gap-6 rounded-[1.5rem] border border-border bg-surface p-5 sm:p-6 lg:sticky lg:top-28">
        <h2 className="text-lg font-semibold tracking-tight">{labels.orderSummary}</h2>

        <ul className="flex flex-col gap-3 border-b border-border pb-4">
          {cart.lines.map((line) => (
            <li key={line.variantId} className="flex gap-3">
              <div className="relative aspect-square w-14 shrink-0 overflow-hidden rounded-xl bg-background">
                {line.imageUrl ? (
                  <Image src={line.imageUrl} alt={line.productName} fill sizes="3.5rem" className="object-contain p-1" />
                ) : (
                  <ProductImagePlaceholder name={line.productName} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{line.productName}</p>
                <p className="text-xs text-muted">
                  <VariantLabel label={line.variantLabel} /> × {line.quantity}
                </p>
                <p className="text-sm font-medium tabular-nums">{formatPrice(line.lineTotal, cart.currencyCode, locale)}</p>
              </div>
            </li>
          ))}
        </ul>

        <dl className="flex flex-col gap-3 text-sm">
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-muted">{cartLabels.subtotal}</dt>
            <dd className="font-medium tabular-nums">{formatPrice(cart.subtotal, cart.currencyCode, locale)}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-muted">{cartLabels.shipping}</dt>
            <dd className="font-medium tabular-nums">{formatPrice(cart.shippingFee, cart.currencyCode, locale)}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 border-t border-border pt-3 text-base">
            <dt className="font-semibold">{cartLabels.total}</dt>
            <dd className="text-xl font-semibold tracking-tight tabular-nums">{formatPrice(cart.total, cart.currencyCode, locale)}</dd>
          </div>
        </dl>

        <button type="submit" disabled={submitting || checkoutBlocked} className={`${buttonPrimary} w-full`}>
          {submitting ? labels.processing : labels.placeOrder}
        </button>
      </aside>
    </form>
  );
}
