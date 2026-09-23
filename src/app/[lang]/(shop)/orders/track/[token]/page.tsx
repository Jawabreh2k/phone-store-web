import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { OrderTrack } from "@/components/order-track";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { api } from "@/lib/api/server";
import { isValidTrackingToken } from "@/lib/order-labels";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  // The URL is a credential: keep every tracking page out of search results.
  return { title: dict.track.title, robots: { index: false, follow: false } };
}

// No loading.tsx for this route on purpose: the order is fetched before anything streams, so an
// unknown token gets a real 404 status (a streamed page is committed to 200). Other API failures
// throw to the [lang] error boundary, which offers a retry.
export default async function TrackOrderPage({
  params,
  searchParams,
}: PageProps<"/[lang]/orders/track/[token]">) {
  const [{ token }, query, locale, dict, requestHeaders] = await Promise.all([
    params,
    searchParams,
    getLocale(),
    getDictionary(),
    headers(),
  ]);
  if (!isValidTrackingToken(token)) notFound();

  const order = await api.trackOrder(locale, token, requestHeaders.get("x-forwarded-for"));
  if (!order) notFound();

  // OrderTrack renders the page heading: the confirmation right after checkout, "Track order" otherwise.
  return (
    <OrderTrack
      locale={locale}
      order={order}
      trackingPath={`/${locale}/orders/track/${token}`}
      placed={query.placed === "1"}
      labels={dict.track}
      confirmation={dict.confirmation}
      cashOnDeliveryLabel={dict.checkout.cashOnDelivery}
    />
  );
}
