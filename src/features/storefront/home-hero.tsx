import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Brand, ProductSummary, PublicSettings } from "@/lib/api/types";
import { formatPrice, t } from "@/lib/format";
import styles from "./home-hero.module.css";
import { ArrowIcon, CartIcon, CheckIcon } from "@/components/ui/icons";
import { ProductImagePlaceholder } from "@/components/ui/product-image-placeholder";
import { StoreLogo } from "@/components/layout/store-logo";
import { buttonInverse } from "@/components/ui/ui";

interface Props {
  locale: Locale;
  dict: Dictionary;
  settings: PublicSettings | null;
  phones: ProductSummary[];
  brands: Brand[];
}

/**
 * Home hero: headline and actions beside a tilted phone whose screen shows this shop's own featured
 * phones scrolling by. Floating price / delivery cards and a brand marquee use live catalogue data.
 * Everything to the side of the copy is decorative (aria-hidden); the same products appear in the grid below.
 */
export function HomeHero({ locale, dict, settings, phones, brands }: Props) {
  const currency = settings?.currencyCode ?? "JOD";
  const price = (amount: number) => formatPrice(amount, currency, locale);

  const feed = phones.slice(0, 6);
  const deal = phones.find((p) => p.compareAtPrice !== null && p.compareAtPrice > p.price) ?? phones.find((p) => p.imageUrl) ?? phones[0];
  const threshold = settings?.freeShippingThreshold;

  // Repeat short brand lists so one copy of the strip is wider than the screen; two copies loop seamlessly.
  const strip = brands.length === 0 ? [] : Array.from({ length: Math.ceil(10 / brands.length) }, () => brands).flat();

  return (
    // Full-bleed band that starts under the transparent header and fills the first screen, so the page
    // colour below stays out of view. The brand strip sits on the bottom edge. On phones the band is exactly
    // one screen tall (growing only if the copy needs it) and the stage takes what the copy leaves.
    <section className="relative isolate flex min-h-dvh flex-col overflow-hidden bg-brand text-brand-foreground [--focus-ring:var(--brand-foreground)] [--grid-line:color-mix(in_srgb,var(--brand-foreground)_7%,transparent)] max-md:h-dvh max-md:min-h-min">
      <div aria-hidden className="bg-grid mask-fade-b pointer-events-none absolute inset-0 -z-10" />

      <div className="page-container grid flex-1 items-center pt-24 sm:pt-28 md:grid-cols-[1fr_1fr] max-md:grid-rows-[auto_minmax(14rem,1fr)]">
        {/* ---- Copy ---- */}
        <div className="relative z-10 flex flex-col gap-7 pt-8 sm:pt-12 md:py-0">
          <h1 className="max-w-lg text-[2.6rem] font-semibold leading-[1.1] tracking-tight sm:text-6xl lg:text-[4.25rem]">
            {dict.home.heroTitle}
          </h1>

          <p className="max-w-sm text-base leading-7 text-brand-foreground/70 sm:text-lg">{dict.home.heroSubtitle}</p>

          <div className="flex flex-wrap items-center gap-x-7 gap-y-4">
            <Link href={`/${locale}/products?type=Phone`} className={`${buttonInverse} ${styles.shine} ${styles.nudge}`}>
              {dict.home.shopPhones}
              <span className={styles.arrow}>
                <ArrowIcon />
              </span>
            </Link>
            <Link
              href={`/${locale}/products?type=Accessory`}
              className={`inline-flex h-12 items-center gap-1.5 rounded-full border border-brand-foreground/25 px-6 text-sm font-medium transition-colors hover:border-brand-foreground/60 hover:bg-brand-foreground/5 ${styles.nudge}`}
            >
              {dict.home.shopAccessories}
              <span className={styles.arrow}>
                <ArrowIcon />
              </span>
            </Link>
          </div>

          {threshold != null && (
            <p className="flex items-center gap-2 text-sm text-brand-foreground/70">
              <CheckIcon className="size-4 text-brand-foreground" />
              {t(dict.home.freeDelivery, { amount: price(threshold) })}
            </p>
          )}
        </div>

        {/* ---- Stage: rings, phone, floating cards ----
            Beside the copy (md+) the stage sets the row height: it gives up space on short screens so the
            brand strip stays on the first screen (11.5rem = header offset + strip), but never below the phone.
            Under the copy (phones) it fills the rest of the screen and the full-size phone rises out of the
            brand strip, cropped by it, rather than shrinking. Size containment stops the phone from growing the row. */}
        <div
          aria-hidden
          className={`relative flex items-start justify-center self-stretch overflow-hidden pt-6 contain-size md:min-h-[clamp(32rem,calc(100dvh-11.5rem),40rem)] md:items-center md:self-auto md:overflow-visible md:pt-0 md:contain-none ${styles.stage}`}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative size-[22rem] sm:size-[28rem]">
              <div className="absolute inset-[18%] rounded-full bg-brand-foreground/5" />
              {[0, 1, 2].map((i) => (
                <div key={i} className={`absolute inset-0 rounded-full border border-brand-foreground/20 ${styles.ring}`} />
              ))}
            </div>
          </div>

          <div className={styles.device}>
            <div className={styles.float}>
              <PhoneFrame>
                <PhoneScreen
                  feed={feed}
                  price={price}
                  storeName={settings?.storeName ?? "PhoneStore"}
                  logoUrl={settings?.logoUrl}
                  dict={dict}
                />
              </PhoneFrame>
            </div>
          </div>

          {deal && (
            <div className={`absolute start-4 top-[12%] sm:start-[6%] ${styles.floatLate}`}>
              <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-2.5 pe-4 text-foreground">
                <div className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-background">
                  {deal.imageUrl ? (
                    <Image src={deal.imageUrl} alt="" fill sizes="48px" className="object-contain p-1" />
                  ) : (
                    <ProductImagePlaceholder name="" />
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="max-w-32 truncate text-xs">{deal.name}</span>
                  <span className="flex items-baseline gap-1.5">
                    {deal.hasPriceRange && <span className="text-[10px] text-muted">{dict.catalog.from}</span>}
                    <span className="text-sm font-semibold">{price(deal.price)}</span>
                    {deal.compareAtPrice !== null && deal.compareAtPrice > deal.price && (
                      <span className="text-[10px] text-accent">{dict.catalog.sale}</span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className={`absolute bottom-[14%] end-4 sm:end-[7%] ${styles.float}`}>
            <div className="flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2.5 text-xs font-medium text-foreground">
              <span className="flex size-5 items-center justify-center rounded-full bg-success text-brand-foreground">
                <CheckIcon className="size-3" />
              </span>
              {dict.product.cashOnDelivery}
            </div>
          </div>
        </div>
      </div>

      {/* ---- Brand marquee (links; the duplicate copy is hidden from assistive tech and the tab order) ---- */}
      {strip.length > 0 && (
        <div className="relative overflow-hidden border-t border-brand-foreground/10 py-5">
          <div className={`flex w-max ${styles.marquee}`}>
            {[0, 1].map((copy) => (
              <ul key={copy} className="flex shrink-0 items-center gap-14 pe-14">
                {strip.map((brand, i) => (
                  // Only the first run of real brands is exposed; visual repeats are hidden and untabbable.
                  <li key={`${brand.id}-${i}`} aria-hidden={copy === 1 || i >= brands.length || undefined}>
                    <Link
                      href={`/${locale}/products?brand=${brand.slug}`}
                      tabIndex={copy === 1 || i >= brands.length ? -1 : undefined}
                      className="text-xl font-semibold tracking-tight text-brand-foreground/45 transition-colors hover:text-brand-foreground"
                    >
                      {brand.name}
                    </Link>
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

/** A generic handset (no specific brand's design): slim bezel, punch-hole camera, side keys. */
function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative aspect-[9/19] w-[196px] rounded-[2.6rem] bg-foreground p-[9px] ring-1 ring-brand-foreground/20 sm:w-[236px]">
      <span className="absolute -end-[3px] top-24 h-12 w-[3px] rounded-e bg-foreground" />
      <span className="absolute -start-[3px] top-20 h-8 w-[3px] rounded-s bg-foreground" />
      <span className="absolute -start-[3px] top-32 h-14 w-[3px] rounded-s bg-foreground" />
      <div className="relative size-full overflow-hidden rounded-[2.05rem] bg-background text-foreground">
        <span className="absolute start-1/2 top-2.5 z-20 size-2.5 -translate-x-1/2 rounded-full bg-foreground rtl:translate-x-1/2" />
        {children}
      </div>
    </div>
  );
}

/** The shop, as it would look on the phone: app bar plus an auto-scrolling feed of featured phones. */
function PhoneScreen({
  feed,
  price,
  storeName,
  logoUrl,
  dict,
}: {
  feed: ProductSummary[];
  price: (amount: number) => string;
  storeName: string;
  logoUrl: string | null | undefined;
  dict: Dictionary;
}) {
  return (
    <>
      <div className="absolute inset-x-0 top-0 z-10 bg-background px-4 pb-2 pt-7">
        <div className="flex items-center justify-between">
          <StoreLogo storeName={storeName} logoUrl={logoUrl} size="xs" />
          <CartIcon className="size-3.5" />
        </div>
        <div className="mt-2.5 flex gap-1.5">
          <span className="rounded-full bg-brand px-2 py-0.5 text-[8px] text-brand-foreground">{dict.catalog.phones}</span>
          <span className="rounded-full border border-border px-2 py-0.5 text-[8px]">{dict.catalog.accessories}</span>
        </div>
      </div>

      {feed.length > 0 && (
        <div className="absolute inset-x-0 bottom-0 top-[4.75rem] overflow-hidden">
          <div className={styles.feed} style={{ "--feed-duration": `${feed.length * 4}s` } as React.CSSProperties}>
            {[...feed, ...feed].map((product, i) => (
              <div key={`${product.id}-${i}`} className="mx-2.5 mb-2.5 rounded-2xl bg-surface p-2">
                <div className="relative h-24 overflow-hidden rounded-xl bg-background">
                  {product.imageUrl ? (
                    <Image src={product.imageUrl} alt="" fill sizes="200px" className="object-contain p-2" />
                  ) : (
                    <ProductImagePlaceholder name="" />
                  )}
                </div>
                <div className="mt-1.5 flex items-end justify-between gap-2 px-0.5">
                  <div className="min-w-0">
                    <p className="truncate text-[9px] text-muted">{product.brandName}</p>
                    <p className="truncate text-[10px] leading-tight">{product.name}</p>
                    <p className="mt-0.5 text-[11px] font-semibold">
                      {product.hasPriceRange && <span className="me-1 text-[8px] font-normal text-muted">{dict.catalog.from}</span>}
                      {price(product.price)}
                    </p>
                  </div>
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-brand text-[11px] leading-none text-brand-foreground">+</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
