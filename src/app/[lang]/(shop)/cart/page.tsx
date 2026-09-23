import type { Metadata } from "next";
import { CartView } from "@/components/cart-view";
import { CheckoutStepper } from "@/components/checkout-stepper";
import { pageTitle } from "@/components/ui";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { api } from "@/lib/api/server";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: dict.cart.title };
}

type CartNotice = "empty" | "unavailable" | "stock_changed";

function pickNotice(value: string | string[] | undefined): CartNotice | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === "empty" || raw === "unavailable" || raw === "stock_changed") return raw;
  return null;
}

export default async function CartPage({ searchParams }: PageProps<"/[lang]/cart">) {
  const [locale, dict, params] = await Promise.all([getLocale(), getDictionary(), searchParams]);
  const settings = await api.settings(locale);
  const notice = pickNotice(params.notice);

  return (
    <div className="flex flex-col gap-8 sm:gap-10">
      <div className="flex flex-col gap-4">
        <CheckoutStepper locale={locale} labels={dict.checkout} current="cart" />
        <h1 className={pageTitle}>{dict.cart.title}</h1>
      </div>
      <CartView locale={locale} labels={dict.cart} notice={notice} freeShippingThreshold={settings?.freeShippingThreshold ?? null} />
    </div>
  );
}
