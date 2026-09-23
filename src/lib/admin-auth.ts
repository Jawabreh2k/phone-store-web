import "server-only";
import { redirect } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { adminApi, ApiError } from "@/lib/api/server";
import type { UserProfile } from "@/lib/api/types";

export type AdminGate =
  | { kind: "anonymous" }
  | { kind: "forbidden"; profile: UserProfile }
  | { kind: "admin"; profile: UserProfile };

export async function getAdminGate(locale: Locale): Promise<AdminGate> {
  const { profile, status } = await adminApi.me(locale);
  if (status === 401 || !profile) return { kind: "anonymous" };
  if (!profile.roles.includes("Admin")) return { kind: "forbidden", profile };
  return { kind: "admin", profile };
}

export function redirectToAdminLogin(locale: Locale): never {
  redirect(`/${locale}/admin/login`);
}

/** Maps admin API failures to login, forbidden, or rethrow. */
export function handleAdminReadError(error: unknown, locale: Locale): never {
  if (error instanceof ApiError) {
    const status = error.problem.status;
    if (status === 401) redirectToAdminLogin(locale);
    if (status === 403) redirect(`/${locale}/admin/login?reauth=1`);
  }
  throw error;
}
