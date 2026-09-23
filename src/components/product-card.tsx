import Image from "next/image";
import Link from "next/link";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import type { ProductSummary } from "@/lib/api/types";
import { formatPrice } from "@/lib/format";
import { Fill } from "./fill";
import { ProductArt } from "./product-art";

interface Props {
  product: ProductSummary;
  locale: Locale;
  currency: string;
  dict: Dictionary["catalog"];
  /** Set on the first row of a page so the largest image loads early. */
  preload?: boolean;
}

/**
 * The photo is the card: a large tile, then a few quiet lines of text with the price loudest. Without a photo
 * the tile shows ProductArt in the product's colours. One badge at most (sale % or out of stock); colour dots
 * sit in the tile. The whole card is one link, so the image is decorative (the name follows it).
 */
export function ProductCard({ product, locale, currency, dict, preload = false }: Props) {
  const onSale = product.compareAtPrice !== null && product.compareAtPrice > product.price;
  const percentOff = onSale ? Math.round((1 - product.price / product.compareAtPrice!) * 100) : 0;
  const dim = product.inStock ? "" : "opacity-45 grayscale-[40%]";

  return (
    <Link href={`/${locale}/products/${product.slug}`} className="group flex h-full flex-col gap-3 rounded-card">
      <div className="relative aspect-[4/5] overflow-hidden rounded-card border border-border/70 bg-surface transition-[box-shadow,translate] duration-300 group-hover:shadow-lift motion-safe:group-hover:-translate-y-0.5">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt=""
            fill
            preload={preload}
            sizes="(min-width: 1024px) 22vw, (min-width: 640px) 30vw, 46vw"
            className={`object-contain p-5 transition-transform duration-500 motion-safe:group-hover:scale-[1.04] sm:p-7 ${dim}`}
          />
        ) : (
          <ProductArt
            type={product.type}
            colors={product.colorHexes}
            className={`absolute inset-0 m-auto size-[88%] transition-transform duration-500 motion-safe:group-hover:-translate-y-1 ${dim}`}
          />
        )}

        {!product.inStock ? (
          <span className="absolute start-3 top-3 rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium">
            {dict.outOfStock}
          </span>
        ) : (
          onSale && (
            <span className="absolute start-3 top-3 rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-brand-foreground">
              <Fill template={dict.salePercent} values={{ percent: <bdi dir="ltr">{percentOff}%</bdi> }} />
            </span>
          )
        )}

        {product.colorHexes.length > 1 && (
          <span aria-hidden className="absolute bottom-3 start-3 flex gap-1.5">
            {product.colorHexes.slice(0, 5).map((hex) => (
              <span key={hex} className="size-3 rounded-full ring-1 ring-foreground/20 ring-inset" style={{ backgroundColor: hex }} />
            ))}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-0.5 px-1">
        <span className="text-xs font-medium text-muted">{product.brandName}</span>
        <h3 className="line-clamp-2 text-[15px] leading-snug font-medium">{product.name}</h3>

        <p className="mt-1 flex flex-wrap items-baseline gap-x-2">
          {/* The price is the cheapest variant; say so when other options cost more. */}
          {product.hasPriceRange && <span className="text-xs text-muted">{dict.from}</span>}
          <bdi className="text-[17px] font-semibold tracking-tight">{formatPrice(product.price, currency, locale)}</bdi>
          {onSale && (
            <bdi className="text-[13px] text-muted line-through">{formatPrice(product.compareAtPrice!, currency, locale)}</bdi>
          )}
        </p>
      </div>
    </Link>
  );
}
