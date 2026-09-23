import { CartPageSkeleton, CheckoutStepperSkeleton, PageTitleSkeleton } from "@/components/skeletons";

export default function CartLoading() {
  return (
    <div className="flex flex-col gap-8 sm:gap-10" aria-busy="true">
      <div className="flex flex-col gap-4">
        <CheckoutStepperSkeleton />
        <PageTitleSkeleton />
      </div>
      <CartPageSkeleton />
    </div>
  );
}
