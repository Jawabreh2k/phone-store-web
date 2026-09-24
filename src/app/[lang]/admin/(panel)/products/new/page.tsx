import type { Metadata } from "next";
import Link from "next/link";
import { AdminProductForm } from "@/components/admin-product-form";
import { BackArrowIcon } from "@/components/icons";
import { buttonSecondary, pageTitle } from "@/components/ui";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { handleAdminReadError } from "@/lib/admin-auth";
import { adminProductsListHref, parseAdminProductsListParams } from "@/lib/admin-products";
import { adminApi } from "@/lib/api/server";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: dict.admin.productForm.createTitle };
}

export default async function NewProductPage({ searchParams }: PageProps<"/[lang]/admin/products/new">) {
  const [locale, dict, query] = await Promise.all([getLocale(), getDictionary(), searchParams]);
  const labels = dict.admin.productForm;
  const backHref = adminProductsListHref(locale, parseAdminProductsListParams(query));

  let brands, categories;
  try {
    [brands, categories] = await Promise.all([adminApi.brands(locale), adminApi.categories(locale)]);
  } catch (error) {
    handleAdminReadError(error, locale);
  }

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <header className="flex flex-col gap-5">
        <Link href={backHref} className={`${buttonSecondary} w-fit`}>
          <BackArrowIcon />
          {dict.admin.productEditor.back}
        </Link>
        <div className="flex flex-col gap-2">
          <h1 className={pageTitle}>{labels.createTitle}</h1>
          <p className="max-w-xl leading-relaxed text-muted">{labels.createSubtitle}</p>
        </div>
      </header>

      <AdminProductForm
        locale={locale}
        brands={brands}
        categories={categories}
        cancelHref={backHref}
        labels={labels}
        saveBarLabels={dict.admin.saveBar}
        languages={dict.admin.languages}
        errorLabels={dict.admin.catalogErrors}
      />
    </div>
  );
}
