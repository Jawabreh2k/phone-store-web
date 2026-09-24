import type { Locale } from "@/i18n/config";
import { authErrorParam } from "@/lib/api/client";

/** Query parameter on the home page that opens the sign-in dialog; its value is where to go once signed in. */
export const signInPromptParam = "signIn";

/**
 * Where a signed-out visitor to an account page is sent: home, with the sign-in dialog open. A failed Google
 * sign-in comes back to the account page with ?authError=, which is carried along so the notice still shows.
 */
export function signInPromptUrl(locale: Locale, returnPath: string, authError?: string | null): string {
  const query = new URLSearchParams({ [signInPromptParam]: returnPath });
  if (authError) query.set(authErrorParam, authError);
  return `/${locale}?${query}`;
}

/** An account page's `authError` query value, if the API sent the browser back with one. */
export function authErrorFrom(searchParams: Record<string, string | string[] | undefined>): string | null {
  const value = searchParams[authErrorParam];
  return (Array.isArray(value) ? value[0] : value) ?? null;
}

/**
 * The return path from the query, only if it is a page of this storefront in this locale. Anything else
 * (another origin, "//host", "javascript:") is dropped, so the parameter can't be used as an open redirect.
 */
export function safeReturnPath(value: string | null, locale: Locale): string | null {
  if (!value || !value.startsWith(`/${locale}/`) || value.includes("\\")) return null;
  const url = new URL(value, "http://store.invalid");
  if (url.origin !== "http://store.invalid") return null;
  return url.pathname + url.search;
}
