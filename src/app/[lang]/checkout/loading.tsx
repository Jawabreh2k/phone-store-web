import { CheckoutPageSkeleton, PageTitleSkeleton } from "@/components/skeletons";

export default function CheckoutLoading() {
  return (
    <div className="flex flex-col gap-8 sm:gap-10" aria-busy="true">
      <PageTitleSkeleton />
      <CheckoutPageSkeleton />
    </div>
  );
}
