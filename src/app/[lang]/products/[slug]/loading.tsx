import { ProductPageSkeleton } from "@/components/skeletons";

export default function ProductLoading() {
  return (
    <div aria-busy="true">
      <ProductPageSkeleton />
    </div>
  );
}
