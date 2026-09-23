import type { Locale } from "@/i18n/config";
import { ApiError, type ApiProblem, type CartDto, type OrderPlacedDto, type PlaceOrderRequest } from "./types";

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