import Image from "next/image";
import Link from "next/link";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import type { ProductSummary } from "@/lib/api/types";
import { formatPrice } from "@/lib/format";
import { ProductImagePlaceholder } from "./product-image-placeholder";

interface Props {
  product: ProductSummary;
  locale: Locale;
  currency: string;
  dict: Dictionary["catalog"];
  /** Set on the first row of a page so the largest image loads early. */
  preload?: boolean;
}

/** The photo is the card: a large image tile, then a few quiet lines of text with the price loudest. */
export function ProductCard({ product, locale, currency, dict, preload = false }: Props) {
  const onSale = product.compareAtPrice !== null && product.compareAtPrice > product.price;

  return (
    <Link href={`/${locale}/products/${product.slug}`} className="group flex flex-col gap-3 rounded-3xl">
      <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-surface">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            preload={preload}
            sizes="(min-width: 1024px) 22vw, (min-width: 640px) 30vw, 46vw"
            className={`object-contain p-5 transition-transform duration-500 group-hover:scale-[1.04] sm:p-7 ${product.inStock ? "" : "opacity-50"}`}
          />
        ) : (
          <ProductImagePlaceholder name={product.name} />
        )}

        {(onSale || !product.inStock) && (
          <span className="absolute start-3 top-3 rounded-full bg-background px-2.5 py-1 text-[11px] font-medium text-accent">
            {product.inStock ? dict.sale : dict.outOfStock}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1 px-1">
        <span className="text-xs text-muted">{product.brandName}</span>
        <h3 className="line-clamp-2 text-[15px] leading-snug">{product.name}</h3>

        <div className="mt-1 flex flex-wrap items-baseline gap-x-2">
          {/* The price is the cheapest variant; say so when other options cost more. */}
          {product.hasPriceRange && <span className="text-xs text-muted">{dict.from}</span>}
          <span className="text-lg font-semibold tracking-tight">{formatPrice(product.price, currency, locale)}</span>
          {onSale && (
            <span className="text-sm text-muted line-through">{formatPrice(product.compareAtPrice!, currency, locale)}</span>
          )}
        </div>

        {product.colorHexes.length > 1 && (
          <div className="mt-1 flex gap-1.5" aria-hidden>
            {product.colorHexes.slice(0, 5).map((hex) => (
              <span key={hex} className="size-3 rounded-full ring-1 ring-border ring-offset-1 ring-offset-background" style={{ backgroundColor: hex }} />
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
