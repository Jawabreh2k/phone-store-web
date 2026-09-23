import Link from "next/link";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import type { ProductSummary } from "@/lib/api/types";
import { ProductCard } from "./product-card";
import { ProductImagePlaceholder } from "./product-image-placeholder";
import { buttonSecondary } from "./ui";

interface Props {
  products: ProductSummary[];
  locale: Locale;
  currency: string;
  dict: Dictionary["catalog"];
  /** Preload the first row's images (use for the grid nearest the top of the page). */
  preloadFirstRow?: boolean;
}

export function ProductGrid({ products, locale, currency, dict, preloadFirstRow = false }: Props) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center gap-5 rounded-3xl bg-surface px-6 py-16 text-center">
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

  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4">
      {products.map((product, index) => (
        <ProductCard
          key={product.id}
          product={product}
          locale={locale}
          currency={currency}
          dict={dict}
          preload={preloadFirstRow && index < 2}
        />
      ))}
    </div>
  );
}
