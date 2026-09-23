import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { CheckIcon } from "@/components/icons";
import { ProductGallery } from "@/components/product-gallery";
import { ProductGrid } from "@/components/product-grid";
import { ProductImagePlaceholder } from "@/components/product-image-placeholder";
import { eyebrow } from "@/components/ui";
import { VariantPicker } from "@/components/variant-picker";
import type { Locale } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { api } from "@/lib/api/server";
import { formatPrice } from "@/lib/format";

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

  return (
    <div className="flex flex-col gap-16 sm:gap-20">
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
          <div className="relative aspect-[4/5] w-full rounded-[2rem] bg-surface">
            <ProductImagePlaceholder name={product.name} />
          </div>
        )}

        <div className="flex flex-col gap-8 md:sticky md:top-28 md:self-start">
          <div className="flex flex-col gap-2">
            <Link href={`/${locale}/products?brand=${product.brand.slug}`} className={`${eyebrow} w-fit hover:text-foreground`}>
              {product.brand.name}
            </Link>
            <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">{product.name}</h1>
          </div>

          <VariantPicker
            variants={product.variants}
            currency={currency}
            locale={locale}
            labels={{
              chooseOption: dict.product.chooseOption,
              addToCart: dict.product.addToCart,
              outOfStock: dict.catalog.outOfStock,
              inStock: dict.catalog.inStock,
              onlyLeft: dict.catalog.onlyLeft,
              comingSoon: dict.product.comingSoon,
              sale: dict.catalog.sale,
            }}
          />

          <p className="flex items-center gap-2 text-sm text-muted">
            <CheckIcon className="size-4 text-success" />
            {dict.product.cashOnDelivery}
          </p>

          <section className="flex flex-col gap-3 border-t border-border pt-8">
            <h2 className={eyebrow}>{dict.product.description}</h2>
            <p className="text-[15px] leading-7">{product.description}</p>
          </section>
        </div>
      </div>

      {product.specifications.length > 0 && (
        <section className="flex flex-col gap-6">
          <h2 className="border-b border-border pb-4 text-2xl font-semibold tracking-tight sm:text-3xl">{dict.product.specifications}</h2>
          <dl className="grid gap-x-12 sm:grid-cols-2">
            {product.specifications.map((spec) => (
              <div key={spec.label} className="flex items-baseline justify-between gap-6 border-b border-border py-4">
                <dt className="text-sm text-muted">{spec.label}</dt>
                <dd className="text-end text-[15px]">
                  <bdi>{spec.value}</bdi>
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {product.related.length > 0 && (
        <section className="flex flex-col gap-6">
          <h2 className="border-b border-border pb-4 text-2xl font-semibold tracking-tight sm:text-3xl">
            {product.type === "Phone" ? dict.product.fitsThisPhone : dict.product.compatibleWith}
          </h2>
          <ProductGrid products={product.related} locale={locale} currency={currency} dict={dict.catalog} />
        </section>
      )}
    </div>
  );
}
