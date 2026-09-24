import type { Dictionary } from "@/i18n/dictionaries";
import { ApiError } from "@/lib/api/types";

type AuthErrors = Dictionary["auth"]["errors"];

function byCode(code: string | null | undefined, errors: AuthErrors): string {
  if (code && code in errors) return errors[code as keyof AuthErrors];
  return errors.generic;
}

/** Maps a failed auth request (forgot / reset password) to a localized message. */
export function authErrorMessage(error: unknown, errors: AuthErrors): string {
  if (!(error instanceof ApiError)) return errors.generic;
  // The auth endpoints are rate limited per client; a 429 has no problem body.
  if (error.problem.status === 429) return errors.rateLimited;
  return byCode(error.problem.code, errors);
}

/** Message for the `?authError=<code>` the API puts on the return URL when a Google sign-in fails. */
export function authErrorFromCode(code: string, errors: AuthErrors): string {
  return byCode(code, errors);
}
