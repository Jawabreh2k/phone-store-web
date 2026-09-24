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

/**
 * A tall panel beside two small ones: the staff dashboard. Deliberately unlike GridIcon (categories), so the
 * two sidebar entries can't be confused.
 */
export function DashboardIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={`${className} rtl:-scale-x-100`} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="5.25" height="12" rx="1.25" />
      <rect x="9.25" y="2" width="4.75" height="5" rx="1.25" />
      <rect x="9.25" y="9" width="4.75" height="5" rx="1.25" />
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

/** A phone handset outline: the product catalogue. */
export function PhoneIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x="4.25" y="1.75" width="7.5" height="12.5" rx="1.75" />
      <path d="M7.25 12h1.5" />
    </svg>
  );
}

/** Headphones: accessories. */
export function HeadphonesIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.75 10V8a5.25 5.25 0 0 1 10.5 0v2" />
      <rect x="2" y="9.25" width="3" height="4.5" rx="1.25" />
      <rect x="11" y="9.25" width="3" height="4.5" rx="1.25" />
    </svg>
  );
}

export function PencilIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.5 2.75l2.75 2.75L6 12.75l-3.25.5.5-3.25z" />
      <path d="M9 4.25L11.75 7" />
    </svg>
  );
}

/** A photo with a mountain and sun: image upload. */
export function ImageIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x="1.75" y="2.75" width="12.5" height="10.5" rx="1.75" />
      <circle cx="5.5" cy="6.25" r="1.1" />
      <path d="M14.25 10.5l-3.5-3.5-6.5 6.25" />
    </svg>
  );
}

/** Arrow out of a tray: upload. */
export function UploadIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 10.25V2.25M5 5.25l3-3 3 3" />
      <path d="M2.25 10.25v2a1.5 1.5 0 0 0 1.5 1.5h8.5a1.5 1.5 0 0 0 1.5-1.5v-2" />
    </svg>
  );
}

/** Box out of a square: opens the page in the store, in a new tab. */
export function ExternalIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={`${className} rtl:-scale-x-100`} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.25 2.75h4v4M13.25 2.75L7.5 8.5" />
      <path d="M11.25 9.5v3a1 1 0 0 1-1 1h-6.5a1 1 0 0 1-1-1v-6.5a1 1 0 0 1 1-1h3" />
    </svg>
  );
}

export function StarIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={className} fill="currentColor">
      <path d="M8 1.9l1.8 3.75 4.1.55-3 2.85.75 4.05L8 11.15l-3.65 1.95.75-4.05-3-2.85 4.1-.55z" />
    </svg>
  );
}

/** Up chevron, e.g. "move earlier" in a list. Down is ChevronDownIcon. */
export function ChevronUpIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 10l4-4 4 4" />
    </svg>
  );
}

/** Two linked rings: compatibility between an accessory and phones. */
export function LinkIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6.75 9.25a2.75 2.75 0 0 0 3.9 0l2.1-2.1a2.75 2.75 0 0 0-3.9-3.9l-.6.6" />
      <path d="M9.25 6.75a2.75 2.75 0 0 0-3.9 0l-2.1 2.1a2.75 2.75 0 0 0 3.9 3.9l.6-.6" />
    </svg>
  );
}

/** A list with bullets: specifications. */
export function ListIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
      <path d="M6 4h7.5M6 8h7.5M6 12h7.5" />
      <path d="M2.75 4h.01M2.75 8h.01M2.75 12h.01" strokeWidth={2} />
    </svg>
  );
}

/** A price tag: brands. */
export function TagIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={`${className} rtl:-scale-x-100`} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M1.75 8.25V2.75a1 1 0 0 1 1-1h5.5l6 6a1 1 0 0 1 0 1.4l-4.1 4.1a1 1 0 0 1-1.4 0z" />
      <circle cx="5.25" cy="5.25" r="1.1" />
    </svg>
  );
}

/** Four tiles: categories. */
export function GridIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round">
      <rect x="2" y="2" width="5" height="5" rx="1.25" />
      <rect x="9" y="2" width="5" height="5" rx="1.25" />
      <rect x="2" y="9" width="5" height="5" rx="1.25" />
      <rect x="9" y="9" width="5" height="5" rx="1.25" />
    </svg>
  );
}

/** Cog: store settings. */
export function GearIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="2" />
      <path d="M8 1.75v1.5M8 12.75v1.5M14.25 8h-1.5M3.25 8h-1.5M12.4 3.6l-1.05 1.05M4.65 11.35 3.6 12.4M12.4 12.4l-1.05-1.05M4.65 4.65 3.6 3.6" />
      <circle cx="8" cy="8" r="4.25" />
    </svg>
  );
}

/** Shop front with an awning: the store's identity. */
export function StoreIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.25 6.25 3.25 2.25h9.5l1 4" />
      <path d="M2.25 6.25a1.95 1.95 0 0 0 3.9 0 1.85 1.85 0 0 0 3.7 0 1.95 1.95 0 0 0 3.9 0" />
      <path d="M3 8.25v5.5h10v-5.5M6.5 13.75v-3h3v3" />
    </svg>
  );
}

/** Speech bubble with a handset: contact details. */
export function ChatIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 1.75a6.25 6.25 0 0 0-5.4 9.4l-.85 3.1 3.1-.85A6.25 6.25 0 1 0 8 1.75z" />
    </svg>
  );
}

/** Coin stack: currency and region. */
export function CoinsIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="6.5" cy="4.5" rx="4.25" ry="2" />
      <path d="M2.25 4.5v3c0 1.1 1.9 2 4.25 2s4.25-.9 4.25-2v-3" />
      <path d="M6 11.4c.2 1.05 2 1.85 4.25 1.85 2.35 0 4.25-.9 4.25-2v-3c0-.95-1.4-1.75-3.3-1.95" />
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

/** Envelope: email alerts. */
export function MailIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x="1.75" y="3.25" width="12.5" height="9.5" rx="1.5" />
      <path d="M2.25 4l5.75 4.5L13.75 4" />
    </svg>
  );
}

/** Head and shoulders: account / sign in. */
export function UserIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="5.25" r="2.75" />
      <path d="M2.5 14c.6-2.8 2.9-4.5 5.5-4.5s4.9 1.7 5.5 4.5" />
    </svg>
  );
}

/**
 * Google's "G" in its own colours: Google's sign-in branding asks for the mark unaltered, so this is the one icon
 * not drawn in currentColor.
 */
export function GoogleIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 18 18" className={className}>
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.97 10.72A5.41 5.41 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.05l3.01-2.33z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A8.97 8.97 0 0 0 9 0 9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z" />
    </svg>
  );
}
