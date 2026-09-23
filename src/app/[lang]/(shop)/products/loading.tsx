import { ListingSkeleton, PageTitleSkeleton } from "@/components/skeletons";

export default function ProductsLoading() {
  return (
    <div className="flex flex-col gap-6 sm:gap-8" aria-busy="true">
      <PageTitleSkeleton crumbs count />
      <ListingSkeleton />
    </div>
  );
}
