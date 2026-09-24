"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import type { Locale } from "@/i18n/config";
import { refreshStorefront } from "@/lib/admin-actions";
import { redirectOnAdminAuthFailure } from "@/lib/admin-client-auth";
import type { StorefrontTag } from "@/lib/storefront-tags";

export type ActionResult<T> = { ok: true; value: T } | { ok: false; error: unknown };

/**
 * Runs one staff mutation: tracks the busy state, re-reads the server page afterwards (router.refresh), sends
 * expired sessions back to sign-in, and flashes "Saved" for a moment. `busy` stays true until the refreshed
 * data has arrived, so the screen never offers a second click on stale values.
 * `storefront` names what the store caches of this data, so a save also shows there straight away.
 */
export function useAdminAction(locale: Locale, { storefront }: { storefront?: StorefrontTag } = {}) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [saved, setSaved] = useState(false);
  const [refreshing, startTransition] = useTransition();
  const savedTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(savedTimer.current), []);

  const run = useCallback(
    async <T>(action: () => Promise<T>, options: { refresh?: boolean } = {}): Promise<ActionResult<T>> => {
      setRunning(true);
      setSaved(false);
      window.clearTimeout(savedTimer.current);
      try {
        const value = await action();
        // Best effort: the save itself succeeded; at worst the store shows it after its usual cache window.
        if (storefront) refreshStorefront(storefront).catch((error: unknown) => console.warn("Storefront cache not refreshed.", error));
        if (options.refresh !== false) startTransition(() => router.refresh());
        setSaved(true);
        savedTimer.current = window.setTimeout(() => setSaved(false), 2500);
        return { ok: true, value };
      } catch (error) {
        redirectOnAdminAuthFailure(error, locale, router);
        return { ok: false, error };
      } finally {
        setRunning(false);
      }
    },
    [locale, router, storefront],
  );

  /** Re-read the page without a mutation, e.g. after a conflict, so staff see the current numbers. */
  const reload = useCallback(() => startTransition(() => router.refresh()), [router]);

  return { run, reload, busy: running || refreshing, saved };
}

/** Asks before closing or reloading the tab while a form has unsaved edits. */
export function useUnsavedChangesWarning(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);
}
