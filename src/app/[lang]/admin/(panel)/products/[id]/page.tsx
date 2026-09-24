import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminProductEditor } from "@/components/admin-product-editor";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { handleAdminReadError } from "@/lib/admin-auth";
import { adminProductsListHref, localized, parseAdminProductsListParams } from "@/lib/admin-products";
import { adminApi, api } from "@/lib/api/server";

export async function generateMetadata({ params }: PageProps<"/[lang]/admin/products/[id]">): Promise<Metadata> {
  const [{ id }, locale, dict] = await Promise.all([params, getLocale(), getDictionary()]);
  const product = await adminApi.product(locale, id).catch(() => null);
  return { title: product ? localized(product.name, locale) : dict.admin.products.title };
}

export default async function AdminProductPage({ params, searchParams }: PageProps<"/[lang]/admin/products/[id]">) {
  const [{ id }, locale, dict, query] = await Promise.all([params, getLocale(), getDictionary(), searchParams]);

  let product, brands, categories;
  try {
    [product, brands, categories] = await Promise.all([adminApi.product(locale, id), adminApi.brands(locale), adminApi.categories(locale)]);
  } catch (error) {
    handleAdminReadError(error, locale);
  }
  if (!product) notFound();

  const [phones, settings] = await Promise.all([
    product.type === "Accessory" ? adminApi.allPhones(locale).catch((error: unknown) => handleAdminReadError(error, locale)) : [],
    api.settings(locale),
  ]);

  return (
    <AdminProductEditor
      locale={locale}
      product={product}
      brands={brands}
      categories={categories}
      phones={phones}
      currency={settings?.currencyCode ?? "JOD"}
      backHref={adminProductsListHref(locale, parseAdminProductsListParams(query))}
      created={query.created === "1"}
      dict={dict}
    />
  );
}
