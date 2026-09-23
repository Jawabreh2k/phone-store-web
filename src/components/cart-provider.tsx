"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import * as cartApi from "@/lib/api/client";
import type { CartDto } from "@/lib/api/types";

/** "error" means the cart could not be loaded (API down, network); `refresh` retries. */
export type CartStatus = "loading" | "ready" | "error";

interface CartContextValue {
  cart: CartDto | null;
  itemCount: number;
  status: CartStatus;
  addItem: (variantId: string, quantity: number) => Promise<CartDto>;
  updateLine: (variantId: string, quantity: number) => Promise<CartDto>;
  removeLine: (variantId: string) => Promise<CartDto>;
  /** Reloads the cart. Never rejects: a failure shows up as status "error". */
  refresh: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  const [cart, setCart] = useState<CartDto | null>(null);
  // Tagged with the locale it belongs to, so switching language shows "loading" until the new cart arrives.
  const [loaded, setLoaded] = useState<{ locale: Locale; failed: boolean } | null>(null);
  const status: CartStatus = loaded?.locale !== locale ? "loading" : loaded.failed ? "error" : "ready";

  const refresh = useCallback(async () => {
    try {
      setCart(await cartApi.getCart(locale));
      setLoaded({ locale, failed: false });
    } catch {
      setLoaded({ locale, failed: true });
    }
  }, [locale]);

  useEffect(() => {
    let cancelled = false;
    cartApi.getCart(locale).then(
      (next) => {
        if (!cancelled) {
          setCart(next);
          setLoaded({ locale, failed: false });
        }
      },
      () => {
        if (!cancelled) setLoaded({ locale, failed: true });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [locale]);

  const applyCart = useCallback((next: CartDto) => {
    setCart(next);
    setLoaded({ locale, failed: false });
  }, [locale]);

  const addItem = useCallback(
    async (variantId: string, quantity: number) => {
      const next = await cartApi.addToCart(locale, variantId, quantity);
      applyCart(next);
      return next;
    },
    [locale, applyCart],
  );

  const updateLine = useCallback(
    async (variantId: string, quantity: number) => {
      const next = await cartApi.updateCartLine(locale, variantId, quantity);
      applyCart(next);
      return next;
    },
    [locale, applyCart],
  );

  const removeLine = useCallback(
    async (variantId: string) => {
      const next = await cartApi.removeCartLine(locale, variantId);
      applyCart(next);
      return next;
    },
    [locale, applyCart],
  );

  const value = useMemo(
    () => ({
      cart,
      itemCount: status === "ready" ? (cart?.itemCount ?? 0) : 0,
      status,
      addItem,
      updateLine,
      removeLine,
      refresh,
    }),
    [cart, status, addItem, updateLine, removeLine, refresh],
  );

  return <CartContext value={value}>{children}</CartContext>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
