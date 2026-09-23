// Loading placeholders shaped like the real screens, so the first paint matches what arrives.
// One file so they stay in step with the components they imitate.

const bar = "animate-pulse rounded-full bg-border";

/** Mirrors ProductCard: image tile, then brand, name and price lines. */
export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex flex-col gap-3">
          <div className="aspect-[4/5] animate-pulse rounded-3xl bg-surface" />
          <div className="flex flex-col gap-2 px-1">
            <div className={`${bar} h-2.5 w-12`} />
            <div className={`${bar} h-3 w-3/4`} />
            <div className={`${bar} h-4 w-16`} />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Mirrors the section heading row on the home page. */
export function SectionHeadingSkeleton() {
  return (
    <div className="flex items-end justify-between border-b border-border pb-4">
      <div className={`${bar} h-8 w-32`} />
      <div className={`${bar} h-3 w-16`} />
    </div>
  );
}

/** Mirrors HomeHero: brand panel with copy on one side and the phone stage on the other. */
export function HeroSkeleton() {
  const onBrand = "animate-pulse rounded-full bg-brand-foreground/15";
  return (
    <div className="overflow-hidden rounded-b-[2rem] bg-brand sm:rounded-b-[3rem]">
      <div className="page-container grid items-center pt-24 sm:pt-28 md:grid-cols-2">
        <div className="flex flex-col gap-7 pt-8 sm:pt-12 md:py-16">
          <div className={`${onBrand} h-7 w-36`} />
          <div className="flex flex-col gap-3">
            <div className={`${onBrand} h-11 w-11/12 sm:h-14`} />
            <div className={`${onBrand} h-11 w-3/4 sm:h-14`} />
          </div>
          <div className={`${onBrand} h-4 w-64 max-w-full`} />
          <div className="flex items-center gap-7">
            <div className={`${onBrand} h-12 w-36`} />
            <div className={`${onBrand} h-3 w-28`} />
          </div>
        </div>
        <div className="flex min-h-[30rem] items-center justify-center sm:min-h-[34rem] md:min-h-[40rem]">
          {/* Same footprint as the phone mock-up. */}
          <div className="aspect-[9/19] w-[196px] animate-pulse rounded-[2.6rem] bg-brand-foreground/10 sm:w-[236px]" />
        </div>
      </div>
      <div className="h-[4.25rem] border-t border-brand-foreground/10" />
    </div>
  );
}

/** Mirrors the product list header: count label and large title. */
export function PageTitleSkeleton() {
  return (
    <div className="flex flex-col gap-3 border-b border-border pb-6">
      <div className={`${bar} h-3 w-20`} />
      <div className={`${bar} h-10 w-56`} />
    </div>
  );
}

/** Mirrors the product page: photo column and the sticky buy column. */
export function ProductPageSkeleton() {
  return (
    <div className="grid gap-8 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] md:gap-12 lg:gap-16">
      <div className="aspect-[4/5] w-full animate-pulse rounded-[2rem] bg-surface" />
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-3">
          <div className={`${bar} h-3 w-16`} />
          <div className={`${bar} h-9 w-3/4`} />
        </div>
        <div className={`${bar} h-10 w-40`} />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className={`${bar} h-9 w-36`} />
          ))}
        </div>
        <div className="h-12 w-full animate-pulse rounded-full bg-border" />
        <div className="flex flex-col gap-2 border-t border-border pt-8">
          <div className={`${bar} h-3 w-full`} />
          <div className={`${bar} h-3 w-5/6`} />
          <div className={`${bar} h-3 w-2/3`} />
        </div>
      </div>
    </div>
  );
}
