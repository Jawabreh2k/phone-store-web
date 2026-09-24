import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AccountOrderCancel } from "@/features/storefront/account-order-cancel";
import { OrderDetailsBody } from "@/features/storefront/order-track";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Fill } from "@/components/ui/fill";
import { LocalDateTime } from "@/components/ui/local-date-time";
import { pageTitle } from "@/components/ui/ui";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { accountApi } from "@/lib/api/server";
import { t } from "@/lib/format";
import { authErrorFrom, signInPromptUrl } from "@/lib/sign-in-prompt";

export async function generateMetadata({ params }: PageProps<"/[lang]/account/orders/[orderNumber]">): Promise<Metadata> {
  const [{ orderNumber }, dict] = await Promise.all([params, getDictionary()]);
  return { title: t(dict.account.orderTitle, { number: orderNumber }), robots: { index: false, follow: false } };
}

// No loading.tsx on purpose (like guest tracking): the order is read before anything streams, so an order
// that isn't this customer's gets a real 404 and a signed-out visitor a real redirect. Other API failures
// throw to the error boundary.
export default async function AccountOrderPage({ params, searchParams }: PageProps<"/[lang]/account/orders/[orderNumber]">) {
  const [{ orderNumber }, query, locale, dict] = await Promise.all([params, searchParams, getLocale(), getDictionary()]);
  const path = `/${locale}/account/orders/${encodeURIComponent(orderNumber)}`;

  const result = await accountApi.order(locale, orderNumber);
  if (!result.signedIn) redirect(signInPromptUrl(locale, path, authErrorFrom(query)));
  const order = result.data;
  if (!order) notFound();

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
        <div className="flex min-w-0 flex-col gap-3">
          <Breadcrumbs
            label={dict.catalog.breadcrumb}
            items={[
              { label: dict.nav.home, href: `/${locale}` },
              { label: dict.account.ordersTitle, href: `/${locale}/account/orders` },
              { label: order.orderNumber },
            ]}
          />
          <h1 className={`${pageTitle} break-words`}>
            <Fill template={dict.account.orderTitle} values={{ number: <bdi className="tabular-nums">{order.orderNumber}</bdi> }} />
          </h1>
          <p className="text-sm text-muted">
            <Fill template={dict.account.placedOn} values={{ date: <LocalDateTime iso={order.placedAt} locale={locale} /> }} />
          </p>
        </div>
        <AccountOrderCancel
          locale={locale}
          orderNumber={order.orderNumber}
          canCancel={order.canCancel}
          labels={dict.account.cancel}
          errors={dict.account.errors}
        />
      </header>

      <OrderDetailsBody locale={locale} order={order} labels={dict.track} cashOnDeliveryLabel={dict.checkout.cashOnDelivery} />
    </div>
  );
}
