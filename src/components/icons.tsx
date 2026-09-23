// Small line icons, drawn in currentColor so they follow the surrounding text colour.

/** Points "forward" in the reading direction, so it flips in RTL. */
export function ArrowIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={`${className} rtl:-scale-x-100`} fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CheckIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d="M3.5 8.5l3 3 6-7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Globe — standard language / locale switch affordance. */
export function GlobeIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="6.25" />
      <path d="M1.75 8h12.5" />
      <path d="M8 1.75a9.5 9.5 0 0 1 0 12.5" />
      <path d="M8 1.75a9.5 9.5 0 0 0 0 12.5" />
    </svg>
  );
}

export function SearchIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth={1.5}>
      <circle cx="7" cy="7" r="4.5" />
      <path d="M10.5 10.5L14 14" strokeLinecap="round" />
    </svg>
  );
}

export function MenuIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d="M2.5 5h11M2.5 11h11" strokeLinecap="round" />
    </svg>
  );
}

export function CloseIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
    </svg>
  );
}

/** Shopping cart with basket, handle and wheels. */
export function CartIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M1.75 1.75h1.15l1.3 7.15h7.55l1.25-5.15H5" />
      <path d="M5.5 1.75V1.4a2.1 2.1 0 0 1 4.2 0v.35" />
      <circle cx="5.65" cy="12.85" r="1" fill="currentColor" stroke="none" />
      <circle cx="11.35" cy="12.85" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** @deprecated Use CartIcon */
export const BagIcon = CartIcon;

export function MinusIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M4 8h8" strokeLinecap="round" />
    </svg>
  );
}

export function PlusIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M8 4v8M4 8h8" strokeLinecap="round" />
    </svg>
  );
}
