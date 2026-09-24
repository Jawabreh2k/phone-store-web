import { CheckoutHeaderSkeleton, CheckoutPageSkeleton } from "@/components/ui/skeletons";

export default function CheckoutLoading() {
  return (
    <div className="flex flex-col gap-6 sm:gap-8" aria-busy="true">
      <CheckoutHeaderSkeleton />
      <CheckoutPageSkeleton />
    </div>
  );
}
