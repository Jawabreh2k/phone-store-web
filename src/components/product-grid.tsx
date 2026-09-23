import Link from "next/link";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import type { ProductSummary } from "@/lib/api/types";
import { ArrowIcon } from "./icons";
import { ProductCard } from "./product-card";
import { ProductImagePlaceholder } from "./product-image-placeholder";
import { brandSurface, buttonSecondary } from "./ui";

/** The indigo "view all" tile that ends a teaser grid. */
export interface GridEndCap {
  href: string;
  title: string;
  /** Small line above the title, e.g. the total number of products. */
  caption?: string;
}

interface Props {
  products: ProductSummary[];
  locale: Locale;
  currency: string;
  dict: Dictionary["catalog"];
  /** Preload the first row's images (use for the grid nearest the top of the page). */
  preloadFirstRow?: boolean;
  /** "page" spans the content column; "sidebar" sits beside the listing's filter column. */
  layout?: keyof typeof layouts;
  /** Teaser grids (home) end on a "view all" tile and drop a product or two so the last row is full. */
  endCap?: GridEndCap;
}

// Column counts at the base, sm and lg breakpoints; they must match the grid classes.
const layouts = {
  page: { grid: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4", cols: [2, 3, 4] },
  sidebar: { grid: "grid-cols-2 sm:grid-cols-3", cols: [2, 3, 3] },
};
const shownAt = ["block", "sm:block", "lg:block"];
const hiddenAt = ["hidden", "sm:hidden", "lg:hidden"];

/**
 * How many products to show at `cols` columns, and whether the end tile follows, so the grid ends on a full
 * row. Drops at most two products; otherwise shows them all and accepts a gap.
 */
function fitRows(count: number, cols: number): { visible: number; endCap: boolean } {
  const rest = count % cols;
  if (rest === 0) return { visible: count, endCap: false };
  const trimmed = count - rest - 1;
  if (rest === cols - 1 || trimmed < cols - 1 || rest + 1 > 2) return { visible: count, endCap: true };
  return { visible: trimmed, endCap: true };
}

export function ProductGrid({ products, locale, currency, dict, preloadFirstRow = false, layout = "page", endCap }: Props) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center gap-5 rounded-panel bg-surface px-6 py-16 text-center">
        <div className="h-24 w-16" aria-hidden>
          <ProductImagePlaceholder name="" />
        </div>
        <p className="max-w-sm text-muted">{dict.noResults}</p>
        <Link href={`/${locale}/products`} className={buttonSecondary}>
          {dict.allProducts}
        </Link>
      </div>
    );
  }

  const { grid, cols } = layouts[layout];
  const fits = endCap ? cols.map((c) => fitRows(products.length, c)) : null;
  // Per-breakpoint visibility classes, only needed when an end tile reshapes the rows.
  const visibility = (show: (fit: { visible: number; endCap: boolean }) => boolean) =>
    fits?.map((fit, i) => (show(fit) ? shownAt[i] : hiddenAt[i])).join(" ");

  return (
    <ul className={`grid gap-x-3 gap-y-8 sm:gap-x-5 ${grid}`}>
      {products.map((product, index) => (
        <li key={product.id} className={visibility((fit) => index < fit.visible)}>
          <ProductCard product={product} locale={locale} currency={currency} dict={dict} preload={preloadFirstRow && index < 2} />
        </li>
      ))}
      {endCap && (
        <li className={visibility((fit) => fit.endCap)}>
          <Link
            href={endCap.href}
            className={`${brandSurface} bg-grid group flex h-full min-h-56 flex-col rounded-card p-5 transition-shadow duration-300 hover:shadow-lift sm:p-6`}
          >
            {endCap.caption && <span className="text-sm text-brand-foreground/70">{endCap.caption}</span>}
            <span className="mt-auto text-xl leading-tight font-semibold tracking-tight sm:text-2xl">{endCap.title}</span>
            <span className="mt-5 inline-flex size-11 items-center justify-center rounded-full bg-brand-foreground text-brand transition-transform duration-300 motion-safe:group-hover:translate-x-1 rtl:motion-safe:group-hover:-translate-x-1">
              <ArrowIcon />
            </span>
          </Link>
        </li>
      )}
    </ul>
  );
}
