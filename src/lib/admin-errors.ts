import type { Dictionary } from "@/i18n/dictionaries";
import { ApiError } from "@/lib/api/types";

type LoginErrors = Dictionary["admin"]["login"]["errors"];
type OrderErrors = Dictionary["admin"]["orders"]["errors"];

export function adminLoginErrorMessage(error: unknown, errors: LoginErrors): string {
  if (!(error instanceof ApiError)) return errors.generic;

  const code = error.problem.code;
  if (code === "auth.invalid_credentials") return errors["auth.invalid_credentials"];
  if (code === "auth.locked_out") return errors["auth.locked_out"];
  if (code && code in errors) return errors[code as keyof LoginErrors];

  return errors.generic;
}

export function adminOrderErrorMessage(error: unknown, errors: OrderErrors): string {
  if (!(error instanceof ApiError)) return errors.generic;

  const code = error.problem.code;
  if (code === "orders.not_found") return errors["orders.not_found"];
  if (code === "orders.invalid_transition") return errors["orders.invalid_transition"];
  if (code === "orders.cannot_cancel") return errors["orders.cannot_cancel"];
  if (code === "validation") return errors.validation;
  if (code && code in errors) return errors[code as keyof OrderErrors];

  return errors.generic;
}
