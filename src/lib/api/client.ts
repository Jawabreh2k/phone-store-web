import type { Locale } from "@/i18n/config";
import { ApiError, type ApiProblem, type CartDto, type OrderPlacedDto, type PlaceOrderRequest, type UserProfile } from "./types";

/** Same-origin API for the browser. Rewrites in next.config.ts proxy to the .NET API. */
function apiUrl(path: string, locale: Locale): string {
  const url = new URL(path, window.location.origin);
  url.searchParams.set("lang", locale);
  return url.pathname + url.search;
}

async function request<T>(path: string, locale: Locale, init: RequestInit = {}): Promise<T> {
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

/** Returns null when the shopper has no cart yet (204). */
export async function getCart(locale: Locale): Promise<CartDto | null> {
  const response = await fetch(apiUrl("/api/cart", locale), {
    credentials: "include",
    cache: "no-store",
    headers: { Accept: "application/json" },
  });

  if (response.status === 204) return null;
  if (!response.ok) {
    const problem = (await response.json().catch(() => null)) as ApiProblem | null;
    throw new ApiError(problem ?? { status: response.status, title: response.statusText });
  }

  return (await response.json()) as CartDto;
}

export function addToCart(locale: Locale, variantId: string, quantity: number): Promise<CartDto> {
  return request<CartDto>("/api/cart/items", locale, {
    method: "POST",
    body: JSON.stringify({ variantId, quantity }),
  });
}

export function updateCartLine(locale: Locale, variantId: string, quantity: number): Promise<CartDto> {
  return request<CartDto>(`/api/cart/items/${encodeURIComponent(variantId)}`, locale, {
    method: "PUT",
    body: JSON.stringify({ quantity }),
  });
}

export function removeCartLine(locale: Locale, variantId: string): Promise<CartDto> {
  return request<CartDto>(`/api/cart/items/${encodeURIComponent(variantId)}`, locale, {
    method: "DELETE",
  });
}

export function placeOrder(locale: Locale, body: PlaceOrderRequest): Promise<OrderPlacedDto> {
  return request<OrderPlacedDto>("/api/orders", locale, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

// ---- Account ----

/** The signed-in customer, or null if there isn't one (a 401 is expected, not an error). */
export async function getSession(locale: Locale): Promise<UserProfile | null> {
  try {
    return await request<UserProfile>("/api/auth/me", locale);
  } catch (error) {
    if (error instanceof ApiError && error.problem.status === 401) return null;
    throw error;
  }
}

export function signUp(locale: Locale, fullName: string, email: string, password: string): Promise<UserProfile> {
  return request<UserProfile>("/api/auth/register", locale, {
    method: "POST",
    body: JSON.stringify({ email, password, fullName, phoneNumber: null, preferredLanguage: locale === "ar" ? "Ar" : "En" }),
  });
}

export function signIn(locale: Locale, email: string, password: string, rememberMe: boolean): Promise<UserProfile> {
  return request<UserProfile>("/api/auth/login", locale, {
    method: "POST",
    body: JSON.stringify({ email, password, rememberMe }),
  });
}

export function signOut(locale: Locale): Promise<void> {
  return request<void>("/api/auth/logout", locale, { method: "POST" });
}

// ---- Account recovery & external sign-in ----

/** Resolves the same way whether or not the email has an account; the API never says which. */
export function requestPasswordReset(locale: Locale, email: string): Promise<void> {
  return request<void>("/api/auth/forgot-password", locale, {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

/** `email` and `token` come from the link in the reset email. */
export function resetPassword(locale: Locale, email: string, token: string, newPassword: string): Promise<void> {
  return request<void>("/api/auth/reset-password", locale, {
    method: "POST",
    body: JSON.stringify({ email, token, newPassword }),
  });
}

/** Query parameter the API adds to the return URL when an external sign-in fails; its value is an error code. */
export const authErrorParam = "authError";

/**
 * Where the browser goes to sign in with Google. It must be a full-page navigation (a plain link, not fetch or
 * next/link): the API redirects to Google, Google back to the API, and the API back to `returnUrl`, now signed in
 * or with `?authError=<code>`. Arriving by a full page load, every signed-in check runs again. Safe to call on the server.
 */
export function googleSignInUrl(locale: Locale, returnUrl: string): string {
  return googleAuthUrl("/api/auth/google/start", locale, returnUrl);
}

/** Signed-in customer connects Google to the account they already have. Same full-page redirect chain as sign-in. */
export function googleConnectUrl(locale: Locale, returnUrl: string): string {
  return googleAuthUrl("/api/auth/google/connect", locale, returnUrl);
}

function googleAuthUrl(path: string, locale: Locale, returnUrl: string): string {
  // Drop an error left over from a previous attempt, so it isn't shown again after this one.
  const back = new URL(returnUrl, "http://store.invalid");
  back.searchParams.delete(authErrorParam);
  const query = new URLSearchParams({ returnUrl: back.pathname + back.search, lang: locale });
  return `${path}?${query}`;
}