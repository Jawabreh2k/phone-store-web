import Link from "next/link";
import { CheckIcon } from "@/components/icons";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";

export type CheckoutStep = "cart" | "details" | "done";

const order: CheckoutStep[] = ["cart", "details", "done"];

interface Props {
  locale: Locale;
  labels: Pick<Dictionary["checkout"], "steps" | "stepCart" | "stepDetails" | "stepDone">;
  current: CheckoutStep;
}

/** Cart, details, confirmation. The cart step links back once the customer has moved on. */
export function CheckoutStepper({ locale, labels, current }: Props) {
  const circle = "inline-flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold";
  const names: Record<CheckoutStep, string> = {
    cart: labels.stepCart,
    details: labels.stepDetails,
    done: labels.stepDone,
  };
  const currentIndex = order.indexOf(current);

  return (
    <nav aria-label={labels.steps} className="flex justify-center">
      <ol className="flex flex-wrap items-center justify-center gap-x-2 gap-y-2 text-sm">
        {order.map((id, index) => {
          const state = index < currentIndex ? "done" : index === currentIndex ? "current" : "upcoming";
          const content = (
            <>
              <span
                className={
                  state === "done"
                    ? `${circle} bg-success text-brand-foreground`
                    : state === "current"
                      ? `${circle} bg-brand text-brand-foreground`
                      : `${circle} border border-border text-muted`
                }
              >
                {state === "done" ? <CheckIcon className="size-4" /> : index + 1}
              </span>
              {names[id]}
            </>
          );
          const itemClass = state === "current" ? "inline-flex items-center gap-2 font-semibold" : "inline-flex items-center gap-2 text-muted";

          return (
            <li key={id} aria-current={state === "current" ? "step" : undefined} className="inline-flex items-center gap-2">
              {index > 0 && <span aria-hidden className="h-px w-6 bg-border sm:w-10" />}
              {id === "cart" && state === "done" ? (
                <Link href={`/${locale}/cart`} className={`${itemClass} rounded-full transition-colors hover:text-foreground`}>
                  {content}
                </Link>
              ) : (
                <span className={itemClass}>{content}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
