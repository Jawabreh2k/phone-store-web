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

  // The message list is secondary: if only it fails, the order still shows (with a notice in its section).
  const messagesRequest = adminApi.orderNotifications(locale, id).catch((error: unknown) => {
    console.warn("Order messages not loaded.", error);
    return null;
  });

  let details;
  try {
    details = await adminApi.order(locale, id);
  } catch (error) {
    handleAdminReadError(error, locale);
  }

  if (!details) notFound();
  const messages = await messagesRequest;

  return (
    <AdminOrderDetail
      locale={locale}
      backHref={backHref}
      details={details}
      messages={messages}
      labels={dict.admin.orders}
      trackLabels={dict.track}
      cashOnDeliveryLabel={dict.checkout.cashOnDelivery}
      loadingLabel={dict.admin.loading}
      closeLabel={dict.admin.dialogClose}
    />
  );
}
