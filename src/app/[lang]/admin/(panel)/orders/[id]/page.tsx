import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminOrderDetail } from "@/features/admin/admin-order-detail";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { handleAdminReadError } from "@/lib/admin-auth";
import { adminOrdersListHref, parseAdminOrdersListParams } from "@/lib/admin-orders-list";
import { adminApi } from "@/lib/api/server";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: dict.admin.orders.detailTitlePrefix };
}

export default async function AdminOrderPage({ params, searchParams }: PageProps<"/[lang]/admin/orders/[id]">) {
  const [{ id }, locale, dict, query] = await Promise.all([params, getLocale(), getDictionary(), searchParams]);
  const backHref = adminOrdersListHref(locale, parseAdminOrdersListParams(query));

  let details;
  try {
    details = await adminApi.order(locale, id);
  } catch (error) {
    handleAdminReadError(error, locale);
  }

  if (!details) notFound();

  return (
    <AdminOrderDetail
      locale={locale}
      backHref={backHref}
      details={details}
      labels={dict.admin.orders}
      trackLabels={dict.track}
      cashOnDeliveryLabel={dict.checkout.cashOnDelivery}
      loadingLabel={dict.admin.loading}
    />
  );
}
