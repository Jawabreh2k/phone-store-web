import { redirect } from "next/navigation";
import { getLocale } from "@/i18n/dictionaries";

export default async function AdminIndexPage() {
  const locale = await getLocale();
  redirect(`/${locale}/admin/orders`);
}
