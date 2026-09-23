import type { Dictionary } from "@/i18n/dictionaries";
import { ApiError } from "@/lib/api/types";
import { t } from "@/lib/format";

/** Most of one item a cart line may hold. Mirrors the API's `Cart.MaxQuantityPerLine`. */
export const maxQuantityPerLine = 10;

/** Maps an API error to a localized cart message. */
export function cartErrorMessage(
  error: unknown,
  errors: Dictionary["cart"]["errors"],
  quantityLimit: string,
): string {
  if (!(error instanceof ApiError)) return errors.generic;

  const { code, errors: fields } = error.problem;
  const quantityRejected =
    code === "validation" && Object.keys(fields ?? {}).some((field) => field.toLowerCase() === "quantity");
  if (code === "cart.quantity_limit" || code === "cart.invalid_quantity" || quantityRejected) {
    return t(quantityLimit, { count: maxQuantityPerLine });
  }

  if (code && code in errors) {
    return errors[code as keyof typeof errors];
  }

  return errors.generic;
}
