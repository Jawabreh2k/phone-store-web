import { CartPageSkeleton, PageTitleSkeleton } from "@/components/skeletons";

export default function CartLoading() {
  return (
    <div className="flex flex-col gap-8 sm:gap-10" aria-busy="true">
      <PageTitleSkeleton />
      <CartPageSkeleton />
    </div>
  );
}
