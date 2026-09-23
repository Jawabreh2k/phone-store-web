// Small line icons, drawn in currentColor so they follow the surrounding text colour.

/** Points "forward" in the reading direction, so it flips in RTL. */
export function ArrowIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={`${className} rtl:-scale-x-100`} fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Points "backward" in the reading direction, so it flips in RTL. */
export function BackArrowIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={`${className} rtl:-scale-x-100`} fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d="M13 8H3M7 4L3 8l4 4" strokeLinecap="round" strokeLinejoin="round" />
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

/** Banknote: cash on delivery. */
export function CashIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x="1.75" y="4.25" width="12.5" height="7.5" rx="1.5" />
      <circle cx="8" cy="8" r="1.75" />
      <path d="M4.25 8h.01M11.75 8h.01" strokeWidth={2} />
    </svg>
  );
}

/** Delivery van, facing the reading direction (flips in RTL). */
export function TruckIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={`${className} rtl:-scale-x-100`} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M1.75 4.25h7.5v6.5h-7.5z" />
      <path d="M9.25 6.5h2.6l2.4 2.4v1.85h-5" />
      <circle cx="4.5" cy="11.75" r="1.25" fill="currentColor" />
      <circle cx="11.5" cy="11.75" r="1.25" fill="currentColor" />
    </svg>
  );
}

/** A route between two points: order tracking. */
export function RouteIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="3.75" cy="3.75" r="1.75" />
      <circle cx="12.25" cy="12.25" r="1.75" />
      <path d="M5.5 3.75h4.75a2.1 2.1 0 0 1 0 4.2h-4.5a2.1 2.1 0 0 0 0 4.3h4.75" />
    </svg>
  );
}

/** Two sliders: the filters control. */
export function SlidersIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
      <path d="M2 5h7M13 5h1M2 11h1M7 11h7" />
      <circle cx="11" cy="5" r="1.75" />
      <circle cx="5" cy="11" r="1.75" />
    </svg>
  );
}

/** Up and down arrows: the sort control. */
export function SortIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 13V3M2.5 5.5 5 3l2.5 2.5M11 3v10M8.5 10.5 11 13l2.5-2.5" />
    </svg>
  );
}

export function ChevronDownIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6l4 4 4-4" />
    </svg>
  );
}

export function TrashIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.75 4.25h10.5M6.25 4.25V2.75h3.5v1.5M4.25 4.25l.6 8.6a1 1 0 0 0 1 .9h4.3a1 1 0 0 0 1-.9l.6-8.6M6.75 7v4M9.25 7v4" />
    </svg>
  );
}

/** Padlock for access-denied states. */
export function LockIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3.25" y="7" width="9.5" height="6.75" rx="1.25" />
      <path d="M5.25 7V5.25a2.75 2.75 0 0 1 5.5 0V7" />
    </svg>
  );
}

/** Circled exclamation mark for notices. */
export function AlertIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
      <circle cx="8" cy="8" r="6.25" />
      <path d="M8 4.75v3.75M8 11.1v.01" strokeWidth={1.75} />
    </svg>
  );
}
