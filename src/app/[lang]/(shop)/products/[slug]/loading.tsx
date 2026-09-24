import { ProductPageSkeleton } from "@/components/ui/skeletons";

export default function ProductLoading() {
  return (
    <div aria-busy="true">
      <ProductPageSkeleton />
    </div>
  );
}
