import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache, type CSSProperties, type ReactNode } from "react";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Fill } from "@/components/ui/fill";
import { CashIcon, TruckIcon } from "@/components/ui/icons";
import { ProductArt } from "@/features/storefront/product-art";
import { ProductGallery } from "@/features/storefront/product-gallery";
import { ProductGrid } from "@/features/storefront/product-grid";
import { SectionHeading } from "@/components/ui/section-heading";
import { eyebrow, panel, sectionTitle } from "@/components/ui/ui";
import { VariantPicker } from "@/features/storefront/variant-picker";
import type { Locale } from "@/i18n/config";
import { getDictionary, getLocale, type Dictionary } from "@/i18n/dictionaries";
import { api } from "@/lib/api/server";
import type { ProductType, PublicSettings } from "@/lib/api/types";
import { formatPrice } from "@/lib/format";
import { initialVariant } from "@/lib/variants";

// Metadata and the page need the same product; cache() makes that a single API call per request.
const loadProduct = cache((locale: Locale, slug: string) => api.product(locale, slug));

export async function generateMetadata({ params }: PageProps<"/[lang]/products/[slug]">): Promise<Metadata> {
  const locale = await getLocale();
  const { slug } = await params;
  const product = await loadProduct(locale, slug);
  if (!product) return {};

  const settings = await api.settings(locale);
  const cheapest = Math.min(...product.variants.map((v) => v.price));
  const description = `${formatPrice(cheapest, settings?.currencyCode ?? "JOD", locale)} · ${product.description}`.slice(0, 200);
  const image = product.images[0]?.url;

  // These tags drive the preview card when a product link is shared on WhatsApp, Instagram or Facebook.
  return {
    title: product.name,
    description,
    alternates: {
      canonical: `/${locale}/products/${product.slug}`,
      languages: { ar: `/ar/products/${product.slug}`, en: `/en/products/${product.slug}` },
    },
    openGraph: { title: product.name, description, type: "website", images: image ? [{ url: image }] : undefined },
  };
}

export default async function ProductPage({ params }: PageProps<"/[lang]/products/[slug]">) {
  const [locale, dict, { slug }] = await Promise.all([getLocale(), getDictionary(), params]);
  const [product, settings] = await Promise.all([loadProduct(locale, slug), api.settings(locale)]);
  if (!product) notFound();

  const currency = settings?.currencyCode ?? "JOD";
  const typeTitle = product.type === "Phone" ? dict.catalog.phones : dict.catalog.accessories;
  // The photo stand-in is drawn in --variant-color, which the picker updates when the colour changes.
  const initialColor = initialVariant(product.variants)?.colorHex;

  return (
    <div data-product style={{ "--variant-color": initialColor } as CSSProperties} className="flex flex-col gap-16 sm:gap-24">
      <div className="flex flex-col gap-6">
        <Breadcrumbs
          label={dict.catalog.breadcrumb}
          items={[
            { label: dict.nav.home, href: `/${locale}` },
            { label: typeTitle, href: `/${locale}/products?type=${product.type}` },
            { label: product.name },
          ]}
        />

        <div className="grid gap-8 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] md:gap-12 lg:gap-16">
          {/* Photos: swipe on phones, thumbnails + arrows everywhere, full-screen viewer with zoom. */}
          {product.images.length > 0 ? (
            <ProductGallery
              images={product.images}
              name={product.name}
              labels={{
                viewLarger: dict.product.viewLarger,
                close: dict.product.close,
                previous: dict.catalog.previous,
                next: dict.catalog.next,
                photoOf: dict.product.photoOf,
              }}
            />
          ) : (
            <ProductStage type={product.type} colors={initialColor ? ["var(--variant-color)"] : []} label={product.name} />
          )}

          <div className="flex flex-col gap-7 md:sticky md:top-28 md:self-start">
            <div className="flex flex-col gap-2">
              <Link href={`/${locale}/products?brand=${product.brand.slug}`} className={`${eyebrow} w-fit hover:text-foreground`}>
                {product.brand.name}
              </Link>
              <h1 className="text-[2rem] leading-[1.1] font-semibold tracking-tight sm:text-4xl lg:text-[2.75rem]">{product.name}</h1>
            </div>

            <VariantPicker
              variants={product.variants}
              currency={currency}
              locale={locale}
              product={{ type: product.type, imageUrl: product.images[0]?.url ?? null }}
              labels={{
                chooseOption: dict.product.chooseOption,
                addToCart: dict.product.addToCart,
                outOfStock: dict.catalog.outOfStock,
                inStock: dict.catalog.inStock,
                onlyLeft: dict.catalog.onlyLeft,
                added: dict.cart.added,
                quantityLimit: dict.cart.quantityLimit,
                errors: dict.cart.errors,
                colour: dict.product.colour,
                memory: dict.product.memory,
                ram: dict.product.ram,
                save: dict.product.save,
                otherColours: dict.product.otherColours,
              }}
            />

            <TrustCards dict={dict} settings={settings} locale={locale} />

            <section className="flex flex-col gap-3 border-t border-border pt-6">
              <h2 className={eyebrow}>{dict.product.description}</h2>
              <p className="text-[15px] leading-7">{product.description}</p>
            </section>
          </div>
        </div>
      </div>

      {product.specifications.length > 0 && (
        <section aria-labelledby="product-specs" className="flex flex-col gap-6 sm:gap-8">
          <h2 id="product-specs" className={sectionTitle}>
            {dict.product.specifications}
          </h2>
          <dl className={`${panel} grid px-5 sm:px-7 lg:grid-cols-2 lg:gap-x-12`}>
            {product.specifications.map((spec) => (
              <div
                key={spec.label}
                className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4 border-t border-border py-4 first:border-t-0 lg:[&:nth-child(2)]:border-t-0"
              >
                <dt className="text-sm text-muted">{spec.label}</dt>
                <dd className="text-[15px]">
                  <bdi>{spec.value}</bdi>
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {product.related.length > 0 && (
        <section aria-labelledby="product-related" className="flex flex-col gap-6 sm:gap-8">
          <SectionHeading id="product-related" title={product.type === "Phone" ? dict.product.fitsThisPhone : dict.product.compatibleWith} />
          <ProductGrid products={product.related} locale={locale} currency={currency} dict={dict.catalog} />
        </section>
      )}
    </div>
  );
}

/**
 * Without photos: the stand-in art on a quiet, static echo of the hero stage (faint grid, two rings).
 * Square on phones; beside the buy column it fits the first screen.
 */
function ProductStage({ type, colors, label }: { type: ProductType; colors: string[]; label: string }) {
  return (
    <div className="relative isolate grid aspect-square place-items-center overflow-hidden rounded-panel border border-border/70 bg-surface md:aspect-auto md:h-[min(40rem,calc(100dvh-10rem))]">
      <div aria-hidden className="bg-grid pointer-events-none absolute inset-0 -z-10 opacity-60 [mask-image:radial-gradient(closest-side,#000_30%,transparent)]" />
      <div aria-hidden className="absolute aspect-square w-[72%] rounded-full border border-brand/10">
        <div className="absolute inset-[16%] rounded-full border border-brand/[0.07] bg-brand/[0.03]" />
        <div className="absolute -inset-[18%] rounded-full border border-brand/[0.06]" />
      </div>
      <ProductArt type={type} colors={colors} label={label} className="relative h-[76%] w-auto md:h-[70%]" />
    </div>
  );
}

/** Cash on delivery and the delivery cost, from the store settings: the hero's floating cards, small. */
function TrustCards({ dict, settings, locale }: { dict: Dictionary; settings: PublicSettings | null; locale: Locale }) {
  const money = (amount: number) => <bdi>{formatPrice(amount, settings?.currencyCode ?? "JOD", locale)}</bdi>;
  const fee = settings?.flatShippingFee;
  const threshold = settings?.freeShippingThreshold;

  let delivery: ReactNode = null;
  if (fee === 0) delivery = dict.product.deliveryFree;
  else if (threshold != null) delivery = <Fill template={dict.product.freeDeliveryOver} values={{ amount: money(threshold) }} />;
  else if (fee != null) delivery = <Fill template={dict.product.deliveryFee} values={{ fee: money(fee) }} />;

  const card = "flex items-center gap-3 rounded-2xl border border-border bg-surface p-3";
  const icon = "inline-flex size-9 shrink-0 items-center justify-center rounded-full text-brand-foreground";

  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      <li className={card}>
        <span className={`${icon} bg-success`}>
          <CashIcon />
        </span>
        <span className="flex flex-col text-sm leading-snug">
          <span className="font-semibold">{dict.product.cashOnDelivery}</span>
          <span className="text-xs text-muted">{dict.product.codHint}</span>
        </span>
      </li>
      {delivery && (
        <li className={card}>
          <span className={`${icon} bg-brand`}>
            <TruckIcon />
          </span>
          <span className="flex flex-col text-sm leading-snug">
            <span className="font-semibold">{dict.product.delivery}</span>
            <span className="text-xs text-muted">{delivery}</span>
          </span>
        </li>
      )}
    </ul>
  );
}
