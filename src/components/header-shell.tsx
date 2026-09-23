"use client";

import Form from "next/form";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { BagIcon, CloseIcon, MenuIcon, SearchIcon } from "./icons";
import { LanguageSwitcher } from "./language-switcher";
import { StoreLogo } from "./store-logo";

/** Scroll distance after which the transparent header turns into the floating pill. */
const FLOAT_AFTER_PX = 10;

interface Props {
  locale: Locale;
  storeName: string;
  logoUrl: string | null;
  labels: {
    phones: string;
    accessories: string;
    cart: string;
    search: string;
    menu: string;
    switchLanguage: string;
  };
}

type Panel = "menu" | "search";

const iconButtonBase = "inline-flex size-9 items-center justify-center rounded-lg transition-colors duration-300";
const navLinkBase = "rounded-lg px-3 py-1.5 text-sm transition-colors duration-300";

/**
 * Colour sets for the two surfaces the transparent header can sit on: the paper page, or the indigo home hero.
 * The floating pill is always light, so it uses the paper set.
 */
const tones = {
  paper: {
    text: "text-foreground",
    link: "text-muted hover:text-foreground",
    icon: "text-muted hover:bg-foreground/5 hover:text-foreground aria-expanded:bg-foreground/5 aria-expanded:text-foreground",
    cart: "bg-brand text-brand-foreground hover:bg-brand/90",
  },
  brand: {
    text: "text-brand-foreground [--focus-ring:var(--brand-foreground)]",
    link: "text-brand-foreground/75 hover:text-brand-foreground",
    icon: "text-brand-foreground/80 hover:bg-brand-foreground/10 hover:text-brand-foreground aria-expanded:bg-brand-foreground/10 aria-expanded:text-brand-foreground",
    cart: "bg-brand-foreground text-brand hover:bg-brand-foreground/90",
  },
} as const;
const panelSurface =
  "pointer-events-auto fixed inset-x-4 top-[78px] z-50 mx-auto rounded-2xl border border-border bg-surface/95 backdrop-blur-xl";

/**
 * Fixed header. At the top of the page it is transparent and borderless, so the page background
 * (and its grid) runs straight through it; once the page scrolls it becomes a floating, blurred pill.
 * Phones get a menu panel; every size gets a search panel.
 */
export function HeaderShell({ locale, storeName, logoUrl, labels }: Props) {
  const pathname = usePathname();
  const [floating, setFloating] = useState(false);

  // A panel belongs to the page it was opened on, so navigating closes it without an effect.
  const [opened, setOpened] = useState<{ panel: Panel; path: string } | null>(null);
  const open = opened?.path === pathname ? opened.panel : null;
  const toggle = (panel: Panel) => setOpened(open === panel ? null : { panel, path: pathname });
  const close = () => setOpened(null);

  const menuId = useId();
  const searchId = useId();

  // The home hero runs behind the header; until the pill appears, the header is drawn light-on-dark.
  const overHero = !floating && pathname === `/${locale}`;
  const tone = overHero ? tones.brand : tones.paper;
  const iconButton = `${iconButtonBase} ${tone.icon}`;
  const navLink = `${navLinkBase} ${tone.link}`;

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      setFloating(window.scrollY > FLOAT_AFTER_PX);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    frame = requestAnimationFrame(update); // correct state when the page loads already scrolled
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpened(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    // The header spans the full width but only the nav takes clicks, so content beside it stays usable.
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-3">
      <nav
        className={`pointer-events-auto relative z-50 flex w-full max-w-7xl items-center justify-between rounded-2xl border px-3 py-2.5 transition-all duration-300 motion-safe:animate-nav-in sm:px-4 ${tone.text} ${
          floating
            ? "border-border bg-background/70 shadow-lg shadow-foreground/10 backdrop-blur-xl"
            : "border-transparent bg-transparent"
        }`}
      >
        {/* The link's accessible name comes from the visible store name (or the uploaded logo's alt). */}
        <Link href={`/${locale}`} className="flex items-center rounded-lg ps-1 transition-colors duration-300">
          <StoreLogo storeName={storeName} logoUrl={logoUrl} inverse={overHero} />
        </Link>

        {/* Centred on the bar regardless of how wide the logo and actions are. */}
        <ul className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 md:flex">
          <li>
            <Link href={`/${locale}/products?type=Phone`} className={navLink}>{labels.phones}</Link>
          </li>
          <li>
            <Link href={`/${locale}/products?type=Accessory`} className={navLink}>{labels.accessories}</Link>
          </li>
        </ul>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            aria-label={labels.search}
            aria-expanded={open === "search"}
            aria-controls={searchId}
            onClick={() => toggle("search")}
            className={iconButton}
          >
            <SearchIcon />
          </button>

          <Suspense fallback={null}>
            <LanguageSwitcher label={labels.switchLanguage} className={`hidden md:inline-flex ${navLink}`} />
          </Suspense>

          <Link
            href={`/${locale}/cart`}
            className={`hidden h-9 items-center gap-2 rounded-lg px-3.5 text-sm font-medium transition-colors duration-300 md:inline-flex ${tone.cart}`}
          >
            <BagIcon />
            {labels.cart}
          </Link>

          <Link href={`/${locale}/cart`} aria-label={labels.cart} className={`${iconButton} md:hidden`}>
            <BagIcon />
          </Link>

          <button
            type="button"
            aria-label={labels.menu}
            aria-expanded={open === "menu"}
            aria-controls={menuId}
            onClick={() => toggle("menu")}
            className={`${iconButton} md:hidden`}
          >
            {open === "menu" ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </nav>

      {open && <div aria-hidden className="pointer-events-auto fixed inset-0 z-40" onClick={close} />}

      {open === "search" && (
        <Form id={searchId} action={`/${locale}/products`} role="search" onSubmit={close} className={`${panelSurface} max-w-2xl p-2`}>
          <SearchIcon className="pointer-events-none absolute start-6 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            type="search"
            name="search"
            autoFocus
            placeholder={labels.search}
            aria-label={labels.search}
            className="h-12 w-full rounded-xl bg-transparent ps-11 pe-4 text-base placeholder:text-muted focus:outline-none"
          />
        </Form>
      )}

      {open === "menu" && (
        <div id={menuId} className={`${panelSurface} flex max-h-[calc(100dvh-6rem)] max-w-7xl flex-col gap-1 overflow-y-auto p-2 md:hidden`}>
          <Link href={`/${locale}/products?type=Phone`} className="rounded-xl px-4 py-3 text-base transition-colors hover:bg-foreground/5">
            {labels.phones}
          </Link>
          <Link href={`/${locale}/products?type=Accessory`} className="rounded-xl px-4 py-3 text-base transition-colors hover:bg-foreground/5">
            {labels.accessories}
          </Link>
          <div className="my-1 border-t border-border" />
          <Suspense fallback={null}>
            <LanguageSwitcher label={labels.switchLanguage} className="rounded-xl px-4 py-3 text-base text-muted transition-colors hover:bg-foreground/5 hover:text-foreground" />
          </Suspense>
          <Link
            href={`/${locale}/cart`}
            className="mt-1 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-brand text-sm font-medium text-brand-foreground"
          >
            <BagIcon />
            {labels.cart}
          </Link>
        </div>
      )}
    </header>
  );
}
