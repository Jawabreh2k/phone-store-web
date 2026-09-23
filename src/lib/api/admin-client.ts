import type { Locale } from "@/i18n/config";
import { ApiError, type ApiProblem, type OrderStatus, type UserProfile } from "./types";

function apiUrl(path: string, locale: Locale): string {
  const url = new URL(path, window.location.origin);
  url.searchParams.set("lang", locale);
  return url.pathname + url.search;
}

async function requestJson<T>(path: string, locale: Locale, init: RequestInit = {}): Promise<T> {
  const response = await fetch(apiUrl(path, locale), {
    ...init,
    credentials: "include",
    cache: "no-store",
    headers: {
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });

  if (!response.ok) {
    const problem = (await response.json().catch(() => null)) as ApiProblem | null;
    throw new ApiError(problem ?? { status: response.status, title: response.statusText });
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export function login(locale: Locale, email: string, password: string, rememberMe: boolean): Promise<UserProfile> {
  return requestJson<UserProfile>("/api/auth/login", locale, {
    method: "POST",
    body: JSON.stringify({ email, password, rememberMe }),
  });
}

export function logout(locale: Locale): Promise<void> {
  return requestJson<void>("/api/auth/logout", locale, { method: "POST" });
}

export function changeOrderStatus(locale: Locale, orderId: string, status: OrderStatus, note?: string | null): Promise<void> {
  return requestJson<void>(`/api/admin/orders/${encodeURIComponent(orderId)}/status`, locale, {
    method: "POST",
    body: JSON.stringify({ status, note: note || null }),
  });
}
