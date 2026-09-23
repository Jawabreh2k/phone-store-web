import { PageTitleSkeleton, ProductGridSkeleton } from "@/components/skeletons";

export default function ProductsLoading() {
  return (
    <div className="flex flex-col gap-10" aria-busy="true">
      <PageTitleSkeleton />
      <ProductGridSkeleton />
    </div>
  );
}
