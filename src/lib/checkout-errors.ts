import type { Dictionary } from "@/i18n/dictionaries";
import { ApiError } from "@/lib/api/types";

type CheckoutErrors = Dictionary["checkout"]["errors"];
type FieldErrors = Dictionary["checkout"]["fieldErrors"];

/** Maps an API error code to a localized checkout message. */
export function checkoutErrorMessage(error: unknown, errors: CheckoutErrors): string {
  if (!(error instanceof ApiError)) return errors.generic;

  const code = error.problem.code;
  if (code === "phone.invalid") return errors["phone.invalid"];
  if (code && code in errors) return errors[code as keyof CheckoutErrors];

  return errors.generic;
}

/** Turns RFC 9457 field errors into localized messages keyed by form field. */
export function mapFieldErrors(
  apiErrors: Record<string, string[]> | undefined,
  fieldErrors: FieldErrors,
): Record<string, string> {
  if (!apiErrors) return {};

  const mapped: Record<string, string> = {};
  for (const [field, messages] of Object.entries(apiErrors)) {
    if (messages.length === 0) continue;
    mapped[field] = field in fieldErrors ? fieldErrors[field as keyof FieldErrors] : fieldErrors.generic;
  }
  return mapped;
}

/**
 * Cart notice for conflicts the customer must resolve on the cart page.
 * `cart.empty` stays on checkout: the order may already be placed, and the tracking link was only in that response.
 */
export function checkoutRedirectNotice(code: string | undefined): "unavailable" | "stock_changed" | null {
  if (code === "cart.item_unavailable" || code === "catalog.variant_not_found") return "unavailable";
  if (code === "orders.stock_changed" || code === "catalog.insufficient_stock") return "stock_changed";
  return null;
}
