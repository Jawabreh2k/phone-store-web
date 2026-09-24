// Loading placeholders shaped like the real screens, so the first paint matches what arrives.
// One file so they stay in step with the components they imitate. The pulse stops under reduced motion.

const pulse = "motion-safe:animate-pulse";
const bar = `${pulse} rounded-full bg-border`;
const tile = `${pulse} border border-border/70 bg-surface`;

/** Mirrors ProductCard: 4:5 tile, then brand, name and price lines. "sidebar" is the listing beside its filters. */
export function ProductGridSkeleton({ count = 8, layout = "page" }: { count?: number; layout?: "page" | "sidebar" }) {
  return (
    <div className={`grid gap-x-3 gap-y-8 sm:gap-x-5 ${layout === "page" ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" : "grid-cols-2 sm:grid-cols-3"}`}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex flex-col gap-3">
          <div className={`${tile} aspect-[4/5] rounded-card`} />
          <div className="flex flex-col gap-2 px-1">
            <div className={`${bar} h-2.5 w-14`} />
            <div className={`${bar} h-3.5 w-3/4`} />
            <div className={`${bar} mt-1 h-4 w-20`} />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Mirrors SectionHeading: eyebrow and title, with the "view all" pill on the end side. */
export function SectionHeadingSkeleton({ link = true }: { link?: boolean }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div className="flex flex-col gap-3">
        <div className={`${bar} h-2.5 w-20`} />
        <div className={`${bar} h-8 w-44 sm:h-10`} />
      </div>
      {link && <div className={`${pulse} h-11 w-28 rounded-full border border-border bg-surface`} />}
    </div>
  );
}

/**
 * Mirrors HomeHero: brand band with the copy and the phone stage. On phones the band is one screen tall and the
 * phone rises out of the brand strip; beside the copy (md+) the stage sets the height.
 */
export function HeroSkeleton() {
  const onBrand = `${pulse} rounded-full bg-brand-foreground/15`;
  return (
    <div className="flex min-h-dvh flex-col overflow-hidden bg-brand max-md:h-dvh max-md:min-h-min">
      <div className="page-container grid flex-1 items-center pt-24 sm:pt-28 md:grid-cols-2 max-md:grid-rows-[auto_minmax(14rem,1fr)]">
        <div className="flex flex-col gap-7 pt-8 sm:pt-12 md:py-0">
          <div className="flex flex-col gap-3">
            <div className={`${onBrand} h-11 w-11/12 sm:h-14`} />
            <div className={`${onBrand} h-11 w-3/4 sm:h-14`} />
          </div>
          <div className={`${onBrand} h-4 w-64 max-w-full`} />
          <div className="flex flex-wrap items-center gap-x-7 gap-y-4">
            <div className={`${onBrand} h-12 w-36`} />
            <div className={`${pulse} h-12 w-40 rounded-full border border-brand-foreground/25`} />
          </div>
          <div className={`${onBrand} h-3 w-52`} />
        </div>
        <div className="flex items-start justify-center self-stretch overflow-hidden pt-6 contain-size md:min-h-[clamp(32rem,calc(100dvh-11.5rem),40rem)] md:items-center md:self-auto md:pt-0 md:contain-none">
          {/* Same footprint as the phone mock-up. */}
          <div className={`${pulse} aspect-[9/19] w-[196px] shrink-0 rounded-[2.6rem] bg-brand-foreground/10 sm:w-[236px]`} />
        </div>
      </div>
      <div className="h-[4.25rem] border-t border-brand-foreground/10" />
    </div>
  );
}

/** Mirrors the home's category tiles (indigo phones tile, paper accessories tile) and their chips. */
export function CategoryTilesSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-[1.2fr_1fr] sm:gap-4">
        <div className={`${pulse} min-h-48 rounded-card bg-brand sm:min-h-64`} />
        <div className={`${tile} min-h-48 rounded-card sm:min-h-64`} />
      </div>
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className={`${pulse} h-9 w-24 rounded-full border border-border bg-surface pointer-coarse:h-11`} />
        ))}
      </div>
    </div>
  );
}

/** Mirrors a page header: optional breadcrumb, large title, optional result count. */
export function PageTitleSkeleton({ crumbs = false, count = false }: { crumbs?: boolean; count?: boolean }) {
  return (
    // Each bar sits in a box the height of the real line, so what follows starts where it will on the page.
    <div className="flex flex-col gap-3">
      {crumbs && (
        <div className="flex h-5 items-center">
          <div className={`${bar} h-3 w-32`} />
        </div>
      )}
      <div className="flex h-[2.2rem] items-center sm:h-[3.3rem]">
        <div className={`${bar} h-8 w-56 sm:h-11`} />
      </div>
      {count && (
        <div className="flex h-5 items-center">
          <div className={`${bar} h-3 w-20`} />
        </div>
      )}
    </div>
  );
}

/** Mirrors the listing: type tabs and sort, the filter column (desktop) or Filters button (phones), and the grid. */
export function ListingSkeleton() {
  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className={`${pulse} h-[2.875rem] w-full rounded-full border border-border bg-surface sm:w-80 pointer-coarse:h-[3.125rem]`} />
        <div className="flex gap-2">
          <div className={`${pulse} h-11 flex-1 rounded-full border border-border bg-surface lg:hidden`} />
          <div className={`${pulse} h-11 flex-1 rounded-full border border-border bg-surface lg:w-48 lg:flex-none`} />
        </div>
      </div>
      <div className="lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:items-start lg:gap-10">
        <div className={`${tile} hidden h-[28rem] rounded-card lg:block`} />
        <ProductGridSkeleton count={6} layout="sidebar" />
      </div>
    </div>
  );
}

/** Mirrors the cart page: one panel of line items and the summary card. */
export function CartPageSkeleton() {
  return (
    <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:items-start lg:gap-12">
      <div className="flex flex-col divide-y divide-border rounded-card border border-border bg-surface">
        {Array.from({ length: 2 }, (_, i) => (
          <div key={i} className="flex gap-4 p-4 sm:gap-5 sm:p-5">
            <div className={`${pulse} aspect-square w-20 shrink-0 rounded-2xl bg-background sm:w-24`} />
            <div className="flex flex-1 flex-col gap-3">
              <div className="flex justify-between gap-3">
                <div className={`${bar} h-4 w-1/2`} />
                <div className={`${bar} h-4 w-16`} />
              </div>
              <div className={`${bar} h-3 w-1/3`} />
              <div className="mt-auto flex items-center gap-2">
                <div className={`${pulse} size-9 rounded-full border border-border pointer-coarse:size-11`} />
                <div className={`${bar} h-3 w-6`} />
                <div className={`${pulse} size-9 rounded-full border border-border pointer-coarse:size-11`} />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-5 rounded-card border border-border bg-surface p-5 sm:p-6">
        <div className={`${bar} h-5 w-32`} />
        <div className={`${pulse} h-16 rounded-2xl bg-background`} />
        <div className={`${bar} h-3.5 w-full`} />
        <div className={`${bar} h-3.5 w-full`} />
        <div className={`${bar} h-6 w-full`} />
        <div className={`${pulse} h-12 w-full rounded-full bg-border`} />
      </div>
    </div>
  );
}

/** Mirrors the cart / checkout / confirmation stepper. */
export function CheckoutStepperSkeleton() {
  return (
    <div className="flex justify-center">
      <div className="flex items-center gap-2">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`${pulse} size-8 rounded-full bg-border`} />
            <div className={`${bar} h-3 w-14`} />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Mirrors checkout's steps and title, for the route's loading screen. */
export function CheckoutHeaderSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <CheckoutStepperSkeleton />
      <PageTitleSkeleton />
    </div>
  );
}

/** A form field: label line and input, at the real sizes. */
function FieldSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-5 items-center">
        <div className={`${bar} h-3 w-24`} />
      </div>
      <div className={`${pulse} h-[2.875rem] w-full rounded-2xl bg-background`} />
    </div>
  );
}

/** Mirrors checkout: the summary toggle (phones), the three numbered sections with their fields, and the summary. */
export function CheckoutPageSkeleton() {
  const section = "flex flex-col gap-4 rounded-card border border-border bg-surface p-5 sm:p-6";
  const title = (
    <div className="flex h-7 items-center gap-3">
      <div className={`${pulse} size-7 rounded-full bg-border`} />
      <div className={`${bar} h-5 w-40`} />
    </div>
  );

  return (
    <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:items-start lg:gap-12">
      <div className="flex flex-col gap-5">
        <div className={`${pulse} h-[4.8rem] rounded-card border border-border bg-surface lg:hidden`} />
        <div className={section}>
          {title}
          <FieldSkeleton />
          <FieldSkeleton />
          <FieldSkeleton />
        </div>
        <div className={section}>
          {title}
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldSkeleton />
            <FieldSkeleton />
          </div>
          <FieldSkeleton />
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldSkeleton />
            <FieldSkeleton />
          </div>
          <div className="flex flex-col gap-2 border-t border-border pt-4">
            <div className={`${bar} h-3 w-32`} />
            <div className={`${pulse} h-24 w-full rounded-2xl bg-background`} />
          </div>
        </div>
        <div className={section}>
          {title}
          <div className={`${pulse} h-[6.75rem] w-full rounded-2xl border-2 border-border sm:h-20`} />
        </div>
      </div>
      <div className="flex flex-col gap-5 rounded-card border border-border bg-surface p-5 sm:p-6">
        <div className="hidden flex-col gap-4 lg:flex">
          <div className={`${bar} h-5 w-32`} />
          <div className={`${pulse} h-14 w-full rounded-xl bg-background`} />
        </div>
        <div className={`${bar} h-3.5 w-full`} />
        <div className={`${bar} h-3.5 w-full`} />
        <div className={`${bar} h-6 w-full`} />
        <div className={`${pulse} h-12 w-full rounded-full bg-border`} />
      </div>
    </div>
  );
}

/** Mirrors the product page: breadcrumb, the stage (or gallery), and the buy column. */
export function ProductPageSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex h-5 items-center">
        <div className={`${bar} h-3 w-48`} />
      </div>
      <div className="grid gap-8 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] md:gap-12 lg:gap-16">
        <div className={`${tile} aspect-square w-full rounded-panel md:aspect-auto md:h-[min(40rem,calc(100dvh-10rem))]`} />
        <div className="flex flex-col gap-7">
          <div className="flex flex-col gap-3">
            <div className={`${bar} h-3 w-16`} />
            <div className={`${bar} h-9 w-3/4 sm:h-11`} />
          </div>
          <div className={`${bar} h-9 w-40`} />
          <div className="flex gap-2">
            {Array.from({ length: 2 }, (_, i) => (
              <div key={i} className={`${pulse} size-11 rounded-full bg-border`} />
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className={`${pulse} h-14 rounded-2xl border border-border bg-surface`} />
            ))}
          </div>
          <div className={`${pulse} h-12 w-full rounded-full bg-border`} />
          <div className="grid gap-2 sm:grid-cols-2">
            <div className={`${pulse} h-16 rounded-2xl border border-border bg-surface`} />
            <div className={`${pulse} h-16 rounded-2xl border border-border bg-surface`} />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Mirrors the staff dashboard: greeting, KPI tiles, chart and side panel. */
export function AdminDashboardSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-6 sm:gap-8">
      <div className="flex flex-col gap-2">
        <div className={`${bar} h-10 w-64`} />
        <div className={`${bar} h-4 w-48`} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className={`${tile} h-28 rounded-card`} />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className={`${tile} h-64 rounded-card`} />
        <div className={`${tile} h-64 rounded-card`} />
      </div>
      <div className={`${tile} h-48 rounded-card`} />
      <div className={`${tile} h-40 rounded-card`} />
    </div>
  );
}

/** Mirrors the staff orders list: search, status chips, and table rows. */
export function AdminOrdersSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-6">
      <div className={`${bar} h-10 w-48`} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className={`${pulse} h-11 flex-1 rounded-2xl border border-border bg-surface`} />
        <div className={`${pulse} h-11 w-24 rounded-full border border-border bg-surface`} />
      </div>
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className={`${pulse} h-9 w-20 rounded-full border border-border bg-surface`} />
        ))}
      </div>
      <div className="flex flex-col gap-3">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className={`${tile} h-16 rounded-card sm:h-12`} />
        ))}
      </div>
    </div>
  );
}

/** Mirrors the staff products list: title and button, type tabs with search, status chips, and rows with a thumbnail. */
export function AdminProductsSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-6 sm:gap-8">
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-3">
          <div className={`${bar} h-10 w-44 sm:h-12`} />
          <div className={`${bar} h-3 w-24`} />
        </div>
        <div className={`${pulse} h-12 w-40 rounded-full bg-border`} />
      </div>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 xl:flex-row">
          <div className={`${pulse} h-[2.875rem] w-full rounded-full border border-border bg-surface sm:w-80`} />
          <div className={`${pulse} h-[2.875rem] flex-1 rounded-2xl border border-border bg-surface`} />
        </div>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className={`${pulse} h-9 w-24 rounded-full border border-border bg-surface`} />
          ))}
        </div>
      </div>
      <div className="flex flex-col divide-y divide-border rounded-card border border-border bg-surface">
        {Array.from({ length: 7 }, (_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4">
            <div className={`${pulse} size-14 shrink-0 rounded-xl bg-background`} />
            <div className="flex flex-1 flex-col gap-2">
              <div className={`${bar} h-3.5 w-2/5`} />
              <div className={`${bar} h-2.5 w-1/4`} />
            </div>
            <div className={`${bar} hidden h-3.5 w-16 sm:block`} />
            <div className={`${pulse} h-6 w-20 rounded-full bg-border`} />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Mirrors the product editor: back link, header with thumbnail, section cards, and the publishing panel. */
export function AdminProductEditorSkeleton() {
  const card = (height: string) => (
    <div className={`${tile} ${height} rounded-card p-6`}>
      <div className="flex items-center gap-3">
        <div className={`${pulse} size-9 rounded-xl bg-border`} />
        <div className={`${bar} h-4 w-40`} />
      </div>
    </div>
  );
  return (
    <div aria-busy="true" className="flex flex-col gap-6 sm:gap-8">
      <div className={`${pulse} h-11 w-40 rounded-full border border-border bg-surface`} />
      <div className="flex items-center gap-5">
        <div className={`${tile} size-16 rounded-2xl sm:size-20`} />
        <div className="flex flex-col gap-2.5">
          <div className={`${bar} h-3 w-32`} />
          <div className={`${bar} h-8 w-64 sm:h-10`} />
          <div className="flex gap-2">
            <div className={`${pulse} h-6 w-20 rounded-full bg-border`} />
            <div className={`${pulse} h-6 w-16 rounded-full bg-border`} />
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-start lg:gap-8">
        <div className={`${tile} h-80 rounded-card lg:col-start-2 lg:row-start-1`} />
        <div className="flex flex-col gap-6 lg:col-start-1 lg:row-start-1">
          {card("h-[30rem]")}
          {card("h-64")}
          {card("h-56")}
        </div>
      </div>
    </div>
  );
}

/** Mirrors "New product": title, the form's section cards, and the next-steps panel. */
export function AdminProductFormSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-6 sm:gap-8">
      <div className={`${pulse} h-11 w-40 rounded-full border border-border bg-surface`} />
      <div className="flex flex-col gap-3">
        <div className={`${bar} h-10 w-56 sm:h-12`} />
        <div className={`${bar} h-3.5 w-80 max-w-full`} />
      </div>
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:gap-10">
        <div className="flex flex-col gap-5">
          <div className={`${tile} h-44 rounded-card`} />
          <div className={`${tile} h-80 rounded-card`} />
          <div className={`${tile} h-64 rounded-card`} />
        </div>
        <div className={`${tile} h-96 rounded-card`} />
      </div>
    </div>
  );
}

/** Mirrors the brand and category screens: title with its line of help, then ordered rows in a card. */
export function AdminTaxonomySkeleton({ groups = 1 }: { groups?: number }) {
  return (
    <div aria-busy="true" className="flex flex-col gap-6 sm:gap-8">
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-3">
          <div className={`${bar} h-10 w-44 sm:h-12`} />
          <div className={`${bar} h-3 w-72 max-w-full`} />
        </div>
        {groups === 1 && <div className={`${pulse} h-12 w-36 rounded-full bg-border`} />}
      </div>
      {Array.from({ length: groups }, (_, g) => (
        <div key={g} className="flex flex-col divide-y divide-border rounded-card border border-border bg-surface">
          {groups > 1 && <div className="h-[4.5rem] px-5 py-5"><div className={`${bar} h-5 w-40`} /></div>}
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3.5">
              <div className={`${pulse} h-12 w-7 rounded-full bg-background`} />
              <div className={`${pulse} size-10 rounded-full bg-background`} />
              <div className="flex flex-1 flex-col gap-2">
                <div className={`${bar} h-3.5 w-1/3`} />
                <div className={`${bar} h-2.5 w-1/5`} />
              </div>
              <div className={`${pulse} h-6 w-11 rounded-full bg-border`} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/** Mirrors the settings page: title, section cards, and the preview panel beside them. */
export function AdminSettingsSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-6 sm:gap-8">
      <div className="flex flex-col gap-3">
        <div className={`${bar} h-10 w-40 sm:h-12`} />
        <div className={`${bar} h-3 w-80 max-w-full`} />
      </div>
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:gap-8">
        <div className="flex flex-col gap-6">
          <div className={`${tile} h-80 rounded-card`} />
          <div className={`${tile} h-52 rounded-card`} />
          <div className={`${tile} h-56 rounded-card`} />
        </div>
        <div className={`${tile} h-72 rounded-card`} />
      </div>
    </div>
  );
}

/** Mirrors the staff order detail: header, items panel, and sidebar. */
export function AdminOrderDetailSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-6">
      <div className={`${bar} h-4 w-28`} />
      <div className={`${bar} h-10 w-64`} />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
        <div className="flex flex-col gap-6">
          <div className={`${tile} min-h-64 rounded-card`} />
          <div className={`${tile} min-h-40 rounded-card`} />
          <div className={`${tile} min-h-48 rounded-card`} />
        </div>
        <div className="flex flex-col gap-4">
          <div className={`${tile} h-32 rounded-card`} />
          <div className={`${tile} h-32 rounded-card`} />
          <div className={`${tile} h-20 rounded-card`} />
        </div>
      </div>
    </div>
  );
}
