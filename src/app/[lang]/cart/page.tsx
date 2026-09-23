import type { Metadata } from "next";
import { CartView } from "@/components/cart-view";
import { getDictionary, getLocale } from "@/i18n/dictionaries";

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
  const notice = pickNotice(params.notice);

  return (
    <div className="flex flex-col gap-8 sm:gap-10">
      <h1 className="border-b border-border pb-6 text-3xl font-semibold tracking-tight sm:text-4xl">{dict.cart.title}</h1>
      <CartView locale={locale} labels={dict.cart} notice={notice} />
    </div>
  );
}
