import Image from "next/image";
import Link from "next/link";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import type { AdminBrand, AdminCategory, AdminProduct, AdminProductListItem } from "@/lib/api/types";
import { localized } from "@/lib/admin-products";
import { plural } from "@/lib/format";
import { AdminProductCompatibility } from "@/features/admin/admin-product-compatibility";
import { AdminProductForm } from "@/features/admin/admin-product-form";
import { AdminProductPhotos } from "@/features/admin/admin-product-photos";
import { AdminProductPublish, type PublishCheck } from "@/features/admin/admin-product-publish";
import { AdminProductSpecs } from "@/features/admin/admin-product-specs";
import { AdminProductVariants } from "@/features/admin/admin-product-variants";
import { BackArrowIcon, CheckIcon, HeadphonesIcon, PhoneIcon, StarIcon } from "@/components/ui/icons";
import { badgeBrand, badgeMuted, badgeSuccess, buttonSecondary } from "@/components/ui/ui";

interface Props {
  locale: Locale;
  product: AdminProduct;
  brands: AdminBrand[];
  categories: AdminCategory[];
  /** Every phone, for an accessory's compatibility picker (empty for phones). */
  phones: AdminProductListItem[];
  currency: string;
  backHref: string;
  /** Just created: say what to do next. */
  created: boolean;
  dict: Dictionary;
}

/** The product editor: header, one card per part of the product, and the publishing panel beside them. */
export function AdminProductEditor({ locale, product, brands, categories, phones, currency, backHref, created, dict }: Props) {
  const admin = dict.admin;
  const labels = admin.productEditor;
  const isPhone = product.type === "Phone";
  const name = localized(product.name, locale);
  const brand = brands.find((b) => b.id === product.brandId)?.name;
  const category = categories.find((c) => c.id === product.categoryId);
  const cover = product.images[0]?.url;
  const totalStock = product.variants.reduce((sum, v) => sum + v.stockQuantity, 0);

  const checks: PublishCheck[] = [
    { id: "options", label: labels.checkOptions, done: product.variants.some((v) => v.isActive), required: true, anchor: "variants" },
    { id: "stock", label: labels.checkStock, done: product.variants.some((v) => v.isActive && v.stockQuantity > 0), required: false, anchor: "variants" },
    { id: "photos", label: labels.checkPhotos, done: product.images.length > 0, required: false, anchor: "photos" },
    { id: "specs", label: labels.checkSpecs, done: product.specifications.length > 0, required: false, anchor: "specifications" },
    ...(isPhone ? [] : [{ id: "fits", label: labels.checkCompatibility, done: product.compatiblePhoneIds.length > 0, required: false, anchor: "compatibility" }]),
  ];

  const sections = [
    { anchor: "details", label: labels.navDetails },
    { anchor: "variants", label: labels.navVariants },
    { anchor: "photos", label: labels.navPhotos },
    { anchor: "specifications", label: labels.navSpecs },
    ...(isPhone ? [] : [{ anchor: "compatibility", label: labels.navCompatibility }]),
  ];

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <header className="flex flex-col gap-5">
        <Link href={backHref} className={`${buttonSecondary} w-fit`}>
          <BackArrowIcon />
          {labels.back}
        </Link>
        <div className="flex items-center gap-4 sm:gap-5">
          <div className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-surface text-muted/50 sm:size-20">
            {cover ? <Image src={cover} alt="" fill sizes="5rem" className="object-contain p-1.5" /> : isPhone ? <PhoneIcon className="size-7" /> : <HeadphonesIcon className="size-7" />}
          </div>
          <div className="flex min-w-0 flex-col gap-1.5">
            <p className="truncate text-xs font-medium text-muted">
              {[brand, category && localized(category.name, locale)].filter(Boolean).join(" · ")}
            </p>
            <h1 className="text-2xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl">{name}</h1>
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              <span className={product.isPublished ? badgeSuccess : badgeMuted}>{product.isPublished ? labels.published : labels.draft}</span>
              <span className={badgeBrand}>{isPhone ? labels.typePhone : labels.typeAccessory}</span>
              {product.isFeatured && (
                <span className="inline-flex h-6 items-center gap-1 rounded-full bg-brand px-2.5 text-xs font-medium text-brand-foreground">
                  <StarIcon className="size-3" />
                  {labels.featured}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {created && (
        <p role="status" className="flex items-start gap-3 rounded-2xl border border-success/25 bg-success/5 px-4 py-3 text-sm leading-relaxed">
          <CheckIcon className="mt-0.5 size-4 shrink-0 text-success" />
          {labels.created}
        </p>
      )}

      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-start lg:gap-8 xl:grid-cols-[minmax(0,1fr)_21rem]">
        {/* First on phones, where status is what staff check first; beside the editor from lg. */}
        <aside className="flex flex-col gap-4 lg:sticky lg:top-6 lg:col-start-2 lg:row-start-1">
          <AdminProductPublish
            locale={locale}
            productId={product.id}
            isPublished={product.isPublished}
            storeHref={`/${locale}/products/${product.slug}`}
            checks={checks}
            summary={`${plural(admin.variants.optionCount, product.variants.length, locale)} · ${plural(admin.variants.unitCount, totalStock, locale)}`}
            labels={labels}
            errorLabels={admin.catalogErrors}
          />
          <nav aria-label={labels.sections} className="hidden lg:block">
            <ul className="flex flex-col gap-0.5 px-2">
              {sections.map((section) => (
                <li key={section.anchor}>
                  <a href={`#${section.anchor}`} className="block rounded-xl px-3 py-2 text-sm text-muted transition-colors hover:bg-foreground/[0.04] hover:text-foreground">
                    {section.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <div className="flex min-w-0 flex-col gap-6 lg:col-start-1 lg:row-start-1">
          <AdminProductForm
            locale={locale}
            product={product}
            brands={brands}
            categories={categories}
            labels={admin.productForm}
            saveBarLabels={admin.saveBar}
            languages={admin.languages}
            errorLabels={admin.catalogErrors}
          />
          <AdminProductVariants
            locale={locale}
            product={product}
            currency={currency}
            labels={admin.variants}
            languages={admin.languages}
            errorLabels={admin.catalogErrors}
            closeLabel={admin.dialogClose}
          />
          <AdminProductPhotos
            locale={locale}
            productId={product.id}
            productName={name}
            images={product.images}
            labels={admin.photos}
            errorLabels={admin.catalogErrors}
            closeLabel={admin.dialogClose}
          />
          <AdminProductSpecs
            locale={locale}
            productId={product.id}
            specifications={product.specifications}
            labels={admin.specs}
            saveBarLabels={admin.saveBar}
            languages={admin.languages}
            errorLabels={admin.catalogErrors}
          />
          {!isPhone && (
            <AdminProductCompatibility
              locale={locale}
              productId={product.id}
              selectedIds={product.compatiblePhoneIds}
              phones={phones}
              labels={admin.compatibility}
              saveBarLabels={admin.saveBar}
              errorLabels={admin.catalogErrors}
            />
          )}
        </div>
      </div>
    </div>
  );
}
