import { CategoryTilesSkeleton, HeroSkeleton, SectionHeadingSkeleton } from "@/components/skeletons";

/** Home: full-bleed hero band under the header, then the category tiles, matching the page's first paint. */
export default function HomeLoading() {
  return (
    <div className="full-bleed -mt-24 flex flex-col gap-16 sm:-mt-28 sm:gap-24" aria-busy="true">
      <HeroSkeleton />
      <section className="page-container flex flex-col gap-6 sm:gap-8">
        <SectionHeadingSkeleton link={false} />
        <CategoryTilesSkeleton />
      </section>
    </div>
  );
}
