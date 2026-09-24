import Image from "next/image";

interface Props {
  storeName: string;
  logoUrl: string | null | undefined;
  /** Header size by default; "xs" for miniature uses such as the phone mock-up in the hero. */
  size?: "md" | "xs";
  /** Light-on-dark version for brand-coloured surfaces (the header while it sits over the home hero). */
  inverse?: boolean;
}

/**
 * The store's logo. An uploaded logo (settings.logoUrl) is used as-is, with the store name as its alt text.
 * Until one exists, the placeholder mark is shown beside the store name as real text, so the name is
 * always in the page's language and matches what screen readers announce.
 */
export function StoreLogo({ storeName, logoUrl, size = "md", inverse = false }: Props) {
  const md = size === "md";

  if (logoUrl) {
    return (
      <Image
        src={logoUrl}
        alt={storeName}
        width={152}
        height={40}
        unoptimized
        className={md ? "h-8 w-auto" : "h-4 w-auto"}
      />
    );
  }

  return (
    <span className={`inline-flex items-center font-semibold tracking-tight ${md ? "gap-2 text-[17px]" : "gap-1 text-[9px]"}`}>
      <LogoMark inverse={inverse} className={md ? "h-8 w-auto" : "h-4 w-auto"} />
      {storeName}
    </span>
  );
}

/**
 * Temporary mark (phone + notification dot), drawn inline with token colours so it follows a retint and
 * can invert on dark surfaces. public/logo.svg is the same mark as a file, for uses outside React.
 */
function LogoMark({ inverse, className }: { inverse: boolean; className: string }) {
  const body = inverse ? "fill-brand-foreground" : "fill-brand";
  const screen = inverse ? "fill-brand" : "fill-surface";
  return (
    <svg aria-hidden viewBox="0 0 30 40" className={`${className} transition-colors duration-300`}>
      <rect x="3" y="3" width="22" height="34" rx="6" className={`${body} transition-colors duration-300`} />
      <rect x="7" y="8" width="14" height="20" rx="2.5" className={`${screen} transition-colors duration-300`} />
      <rect x="11" y="31" width="6" height="2" rx="1" className={`${screen} transition-colors duration-300`} />
      <circle
        cx="24"
        cy="6"
        r="5"
        strokeWidth="2"
        className={`fill-accent transition-colors duration-300 ${inverse ? "stroke-brand" : "stroke-background"}`}
      />
    </svg>
  );
}
