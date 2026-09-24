/** Shown until real product photos are uploaded. Quiet on purpose, so a grid with some missing photos still looks intentional. */
export function ProductImagePlaceholder({ name }: { name: string }) {
  return (
    <div role="img" aria-label={name} className="flex size-full items-center justify-center text-muted/35">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1} className="h-2/5 w-auto">
        <rect x="6.5" y="2" width="11" height="20" rx="2.5" />
        <path d="M10.75 19h2.5" strokeLinecap="round" />
      </svg>
    </div>
  );
}
