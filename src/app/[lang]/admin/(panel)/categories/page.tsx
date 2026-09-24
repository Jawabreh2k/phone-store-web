import type { Metadata } from "next";
import { AdminCategories } from "@/features/admin/admin-categories";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { handleAdminReadError } from "@/lib/admin-auth";
import { adminApi } from "@/lib/api/server";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: dict.admin.categories.title };
}

export default async function AdminCategoriesPage() {
  const [locale, dict] = await Promise.all([getLocale(), getDictionary()]);

  let categories;
  try {
    categories = await adminApi.categories(locale);
  } catch (error) {
    handleAdminReadError(error, locale);
  }

  return (
    <AdminCategories
      locale={locale}
      categories={categories}
      labels={dict.admin.categories}
      listLabels={dict.admin.taxonomy}
      languages={dict.admin.languages}
      errorLabels={dict.admin.catalogErrors}
      closeLabel={dict.admin.dialogClose}
    />
  );
}
