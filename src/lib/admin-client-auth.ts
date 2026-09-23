import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import type { Locale } from "@/i18n/config";
import { ApiError } from "@/lib/api/types";

/** Expired sessions and stale role claims should return to staff login. */
export function redirectOnAdminAuthFailure(error: unknown, locale: Locale, router: AppRouterInstance): boolean {
  if (!(error instanceof ApiError)) return false;
  const status = error.problem.status;
  if (status === 401 || status === 403) {
    router.replace(`/${locale}/admin/login${status === 403 ? "?reauth=1" : ""}`);
    return true;
  }
  return false;
}
