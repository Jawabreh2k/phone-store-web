import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout-form";
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
    <div className="flex flex-col gap-8 sm:gap-10">
      <h1 className="border-b border-border pb-6 text-3xl font-semibold tracking-tight sm:text-4xl">{dict.checkout.title}</h1>

      {settings?.allowGuestCheckout === false ? (
        <div className="rounded-[1.5rem] border border-border bg-surface px-6 py-16 text-center">
          <p className="text-lg text-muted">{dict.checkout.guestCheckoutDisabled}</p>
        </div>
      ) : (
        <CheckoutForm locale={locale} labels={dict.checkout} cartLabels={dict.cart} />
      )}
    </div>
  );
}
