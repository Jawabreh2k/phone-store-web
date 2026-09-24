"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { ChevronDownIcon, CloseIcon, SlidersIcon, SortIcon } from "@/components/ui/icons";
import { buttonPrimary, buttonSecondary, chipChoice, fieldInput, iconButton } from "@/components/ui/ui";

export interface FilterOption {
  value: string;
  label: string;
  checked: boolean;
  /** The listing with this option applied (the desktop panel's links). */
  href: string;
}

export interface FilterGroup {
  name: string;
  legend: string;
  options: FilterOption[];
}

/** Everything the filters show, computed on the server from the URL. */
export interface FilterState {
  /** The listing path the form submits to, e.g. /ar/products. */
  action: string;
  /** Query values the filters don't edit but must keep: type, search, sort. */
  keep: Record<string, string>;
  groups: FilterGroup[];
  minPrice?: number;
  maxPrice?: number;
  inStock: boolean;
  /** Applied filters, for the badge on the Filters button. */
  activeCount: number;
}

export interface FilterLabels {
  filters: string;
  showResults: string;
  reset: string;
  price: string;
  priceMin: string;
  priceMax: string;
  apply: string;
  inStockOnly: string;
  close: string;
}

/**
 * The filters as one GET form, so the URL stays the source of truth. "panel" (desktop column) applies each
 * choice at once: options are links, the stock switch submits on change, price has its own Apply button.
 * "sheet" (phones) stages choices as radio chips and applies them together.
 */
function FilterForm({ state, labels, mode, onApply }: { state: FilterState; labels: FilterLabels; mode: "panel" | "sheet"; onApply?: () => void }) {
  const router = useRouter();
  const form = useRef<HTMLFormElement>(null);

  // Builds the URL from the form, leaving out empty fields (a plain GET would add "brand=&minPrice=").
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = new URLSearchParams();
    for (const [key, value] of new FormData(event.currentTarget)) {
      if (typeof value === "string" && value.trim() !== "") query.set(key, value.trim());
    }
    onApply?.();
    const search = query.toString();
    router.push(`${state.action}${search ? `?${search}` : ""}`, { scroll: mode === "sheet" });
  };

  // Staged reset in the sheet: back to "all" everywhere, applied with Show results.
  const reset = () => {
    for (const el of form.current?.elements ?? []) {
      if (!(el instanceof HTMLInputElement)) continue;
      if (el.type === "radio") el.checked = el.value === "";
      else if (el.type === "checkbox") el.checked = false;
      else if (el.type === "number") el.value = "";
    }
  };

  const priceInput = `${fieldInput} h-11 py-0 [appearance:textfield] rtl:text-right [&::-webkit-inner-spin-button]:appearance-none`;

  const fields = (
    <>
      {state.groups.map((group) =>
        mode === "panel" ? (
          <div key={group.name} className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold">{group.legend}</h3>
            <ul className="-mx-2 flex flex-col">
              {group.options.map((option) => (
                <li key={option.value}>
                  <Link
                    href={option.href}
                    scroll={false}
                    aria-current={option.checked ? "true" : undefined}
                    className="group flex min-h-9 items-center gap-3 rounded-xl px-2 text-sm transition-colors hover:bg-foreground/5 aria-[current=true]:font-semibold pointer-coarse:min-h-11"
                  >
                    <span
                      aria-hidden
                      className="size-4.5 shrink-0 rounded-full border-[1.5px] border-muted/60 transition-[border-width,border-color] group-aria-[current=true]:border-[5px] group-aria-[current=true]:border-brand"
                    />
                    {option.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <fieldset key={group.name} className="flex flex-col gap-3">
            <legend className="mb-3 text-sm font-semibold">{group.legend}</legend>
            <div className="flex flex-wrap gap-2">
              {group.options.map((option) => (
                <label key={option.value} className={chipChoice}>
                  <input type="radio" name={group.name} value={option.value} defaultChecked={option.checked} className="sr-only" />
                  {option.label}
                </label>
              ))}
            </div>
          </fieldset>
        ),
      )}

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-3 text-sm font-semibold">
          {labels.price}
        </legend>
        <div className="flex items-center gap-2">
          <input name="minPrice" type="number" inputMode="numeric" min={0} step="any" dir="ltr" defaultValue={state.minPrice} placeholder={labels.priceMin} aria-label={labels.priceMin} className={priceInput} />
          <span aria-hidden className="text-muted">
            –
          </span>
          <input name="maxPrice" type="number" inputMode="numeric" min={0} step="any" dir="ltr" defaultValue={state.maxPrice} placeholder={labels.priceMax} aria-label={labels.priceMax} className={priceInput} />
        </div>
        {mode === "panel" && (
          <button type="submit" className={`${buttonSecondary} w-full`}>
            {labels.apply}
          </button>
        )}
      </fieldset>

      <label className="flex cursor-pointer items-center justify-between gap-4 text-sm font-semibold">
        {labels.inStockOnly}
        <input
          type="checkbox"
          role="switch"
          name="inStock"
          value="1"
          defaultChecked={state.inStock}
          onChange={mode === "panel" ? (event) => event.currentTarget.form?.requestSubmit() : undefined}
          className="peer sr-only"
        />
        <span
          aria-hidden
          className="relative h-6 w-10 shrink-0 rounded-full bg-muted/70 transition-colors peer-checked:bg-brand peer-focus-visible:outline-2 peer-focus-visible:outline-offset-3 peer-focus-visible:outline-brand after:absolute after:start-0.5 after:top-0.5 after:size-5 after:rounded-full after:bg-surface after:transition-transform peer-checked:after:translate-x-4 rtl:peer-checked:after:-translate-x-4"
        />
      </label>
    </>
  );

  // The panel's options are links, so the form carries their current values for the price and stock controls.
  const carried = mode === "panel" ? state.groups.map((group) => [group.name, group.options.find((o) => o.checked)?.value ?? ""] as const) : [];

  return (
    <form ref={form} action={state.action} onSubmit={submit} className={mode === "panel" ? "flex flex-col gap-7" : "flex min-h-0 flex-1 flex-col"}>
      {Object.entries(state.keep).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      {carried.map(([name, value]) => (value ? <input key={name} type="hidden" name={name} value={value} /> : null))}

      {mode === "panel" ? (
        fields
      ) : (
        <>
          <div className="flex flex-col gap-7 overflow-y-auto px-5 pt-2 pb-6">{fields}</div>
          <div className="flex gap-3 border-t border-border px-5 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <button type="button" onClick={reset} className={`${buttonSecondary} flex-1`}>
              {labels.reset}
            </button>
            <button type="submit" className={`${buttonPrimary} flex-[2]`}>
              {labels.showResults}
            </button>
          </div>
        </>
      )}
    </form>
  );
}

// Inputs are uncontrolled, and a navigation keeps this component mounted: keying the form by the state
// rebuilds it whenever the URL changes (e.g. a filter chip was removed), so it never shows stale choices.
const formKey = (state: FilterState) => JSON.stringify(state);

/** Desktop filter column. */
export function FilterPanel({ state, labels }: { state: FilterState; labels: FilterLabels }) {
  return <FilterForm key={formKey(state)} state={state} labels={labels} mode="panel" />;
}

/**
 * Phones and tablets: a Filters button that opens the filters as a bottom sheet (native <dialog>: focus trap
 * and Escape for free), plus a floating copy of the button once the inline one has scrolled away.
 */
export function FilterSheet({ state, labels }: { state: FilterState; labels: FilterLabels }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [showPill, setShowPill] = useState(false);
  const id = useId();

  useEffect(() => {
    const button = trigger.current;
    if (!button) return;
    const footer = document.querySelector("footer");
    let buttonVisible = true;
    let footerVisible = false;
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === button) buttonVisible = entry.isIntersecting || entry.boundingClientRect.top > 0;
        else footerVisible = entry.isIntersecting;
      }
      setShowPill(!buttonVisible && !footerVisible);
    });
    observer.observe(button);
    if (footer) observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  const open = () => dialog.current?.showModal();
  const close = () => dialog.current?.close();

  const badge =
    state.activeCount > 0 ? (
      <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-xs font-semibold text-brand-foreground">
        {state.activeCount}
      </span>
    ) : null;

  return (
    <>
      <button ref={trigger} type="button" onClick={open} aria-haspopup="dialog" aria-controls={id} className={`${buttonSecondary} flex-1`}>
        <SlidersIcon />
        {labels.filters}
        {badge}
      </button>

      <button
        type="button"
        onClick={open}
        aria-haspopup="dialog"
        aria-controls={id}
        aria-hidden={!showPill}
        inert={!showPill}
        className={`${buttonPrimary} fixed inset-x-0 bottom-[calc(1.25rem+env(safe-area-inset-bottom))] z-30 mx-auto w-fit px-6 shadow-float motion-safe:transition-[translate,opacity] motion-safe:duration-300 lg:hidden ${
          showPill ? "" : "pointer-events-none translate-y-4 opacity-0"
        }`}
      >
        <SlidersIcon />
        {labels.filters}
        {state.activeCount > 0 && (
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-foreground px-1.5 text-xs font-semibold text-brand">
            {state.activeCount}
          </span>
        )}
      </button>

      <dialog
        ref={dialog}
        id={id}
        aria-labelledby={`${id}-title`}
        // A click on the dimmed backdrop lands on the dialog element itself.
        onClick={(event) => event.target === event.currentTarget && close()}
        className="fixed inset-x-0 top-auto bottom-0 m-0 max-h-[88dvh] w-full max-w-none overflow-hidden rounded-t-panel border-0 bg-surface p-0 text-foreground shadow-float backdrop:bg-foreground/40 motion-safe:transition-transform motion-safe:duration-300 motion-safe:starting:open:translate-y-full"
      >
        <div className="mx-auto flex max-h-[88dvh] w-full max-w-2xl flex-col">
          <div aria-hidden className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-border" />
          <div className="flex shrink-0 items-center justify-between gap-4 px-5 pt-2 pb-3">
            <h2 id={`${id}-title`} className="text-lg font-semibold tracking-tight">
              {labels.filters}
            </h2>
            <button type="button" onClick={close} aria-label={labels.close} className={iconButton}>
              <CloseIcon />
            </button>
          </div>
          <FilterForm key={formKey(state)} state={state} labels={labels} mode="sheet" onApply={close} />
        </div>
      </dialog>
    </>
  );
}

/** Sort as a native select: the OS picker on phones, one compact control on desktop. Applies on change. */
export function SortSelect({
  label,
  value,
  options,
  className = "",
}: {
  label: string;
  value: string;
  options: { value: string; label: string; href: string }[];
  className?: string;
}) {
  const router = useRouter();
  const id = useId();

  return (
    <div className={`items-center gap-3 ${className}`}>
      <label htmlFor={id} className="text-sm text-muted max-lg:sr-only">
        {label}
      </label>
      <div className="relative flex-1">
        <SortIcon className="pointer-events-none absolute start-4 top-1/2 size-4 -translate-y-1/2 text-muted" />
        <select
          id={id}
          key={value}
          defaultValue={value}
          onChange={(event) => {
            const option = options.find((o) => o.value === event.target.value);
            if (option) router.push(option.href, { scroll: false });
          }}
          className="h-11 w-full cursor-pointer appearance-none rounded-full border border-border bg-surface ps-10 pe-10 text-sm font-medium text-foreground transition-colors hover:border-foreground/40"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDownIcon className="pointer-events-none absolute end-4 top-1/2 size-4 -translate-y-1/2 text-muted" />
      </div>
    </div>
  );
}
