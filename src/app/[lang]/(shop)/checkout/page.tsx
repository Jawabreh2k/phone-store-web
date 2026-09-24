import type { Metadata } from "next";
import { CheckoutForm } from "@/features/storefront/checkout-form";
import { CheckoutStepper } from "@/features/storefront/checkout-stepper";
import { pageTitle } from "@/components/ui/ui";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { api } from "@/lib/api/server";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: dict.checkout.title };
}

export default async function CheckoutPage() {
  const locale = await getLocale();
  const [dict, settings] = await Promise.all([getDictionary(), api.settings(locale)]);

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <div className="flex flex-col gap-4">
        <CheckoutStepper locale={locale} labels={dict.checkout} current="details" />
        <h1 className={pageTitle}>{dict.checkout.title}</h1>
      </div>

      {settings?.allowGuestCheckout === false ? (
        <div className="rounded-panel border border-border bg-surface px-6 py-16 text-center">
          <p className="text-lg text-muted">{dict.checkout.guestCheckoutDisabled}</p>
        </div>
      ) : (
        <CheckoutForm locale={locale} labels={dict.checkout} cartLabels={dict.cart} />
      )}
    </div>
  );
}
