import type { Metadata } from "next";
import { AdminBrands } from "@/features/admin/admin-brands";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { handleAdminReadError } from "@/lib/admin-auth";
import { adminApi } from "@/lib/api/server";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: dict.admin.brands.title };
}

export default async function AdminBrandsPage() {
  const [locale, dict] = await Promise.all([getLocale(), getDictionary()]);

  let brands;
  try {
    brands = await adminApi.brands(locale);
  } catch (error) {
    handleAdminReadError(error, locale);
  }

  return (
    <AdminBrands
      locale={locale}
      brands={brands}
      labels={dict.admin.brands}
      listLabels={dict.admin.taxonomy}
      errorLabels={dict.admin.catalogErrors}
      closeLabel={dict.admin.dialogClose}
    />
  );
}
