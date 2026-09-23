import type { ProductType } from "@/lib/api/types";

interface Props {
  type: ProductType;
  /** Body colours, most prominent first: hex values, or a CSS variable (the product page passes the selected colour). */
  colors: readonly string[];
  /** Accessible name. Leave it out where the product name is already next to the art (cards, cart lines). */
  label?: string;
  className?: string;
}

/**
 * Stand-in for a missing product photo, drawn in the product's own colours, so a catalogue without photos still
 * shows what is on offer. Phones are the hero's generic handset (front with the indigo grid screen, back behind it);
 * accessories are material swatches rather than a made-up device. Mirrored in RTL. A real photo replaces it as-is.
 */
export function ProductArt({ type, colors, label, className = "" }: Props) {
  const a11y = label ? { role: "img", "aria-label": label } : { "aria-hidden": true };

  return (
    <svg viewBox="0 0 160 200" className={`rtl:-scale-x-100 ${className}`} {...a11y}>
      {/* Soft floor shadow. */}
      <ellipse cx="80" cy={type === "Phone" ? 177 : 160} rx="58" ry="8" className="fill-foreground" fillOpacity={0.05} />
      <ellipse cx="80" cy={type === "Phone" ? 176 : 159} rx="38" ry="4.5" className="fill-foreground" fillOpacity={0.07} />
      {type === "Phone" ? <Handsets colors={colors} /> : <Swatches colors={colors} />}
    </svg>
  );
}

/** Fill for a body part: the product colour, or ink when the product has none. */
function bodyFill(color: string | undefined) {
  return color ? { style: { fill: color } } : { className: "fill-foreground" };
}

/** Front and back of the same generic handset (60 x 124 units each). */
function Handsets({ colors }: { colors: readonly string[] }) {
  return (
    <>
      <g transform="translate(68 30) rotate(9 27 56) scale(0.9)">
        <HandsetBack color={colors[1] ?? colors[0]} />
      </g>
      <g transform="translate(40 46) scale(0.94)">
        <HandsetFront color={colors[0]} />
      </g>
    </>
  );
}

// Faint grid on the screen: the hero's texture in miniature.
const screenGrid = [
  ...[12, 19.5, 27, 34.5, 42, 49.5].map((x) => `M${x} 4.5V119.5`),
  ...Array.from({ length: 14 }, (_, i) => `M4.5 ${12 + i * 7.5}H55.5`),
].join("");

function HandsetFront({ color }: { color: string | undefined }) {
  return (
    <>
      <rect x="1" y="1" width="58" height="122" rx="11" {...bodyFill(color)} stroke="currentColor" strokeOpacity={0.16} />
      <rect x="4.5" y="4.5" width="51" height="115" rx="8" className="fill-brand" />
      <path d={screenGrid} fill="none" className="stroke-brand-foreground" strokeOpacity={0.1} strokeWidth={0.6} />
      <circle cx="30" cy="84" r="25" fill="none" className="stroke-brand-foreground" strokeOpacity={0.08} />
      <circle cx="30" cy="84" r="15" fill="none" className="stroke-brand-foreground" strokeOpacity={0.14} />
      <circle cx="30" cy="84" r="7" className="fill-brand-foreground" fillOpacity={0.06} />
      <circle cx="30" cy="11" r="1.9" className="fill-foreground" />
    </>
  );
}

function HandsetBack({ color }: { color: string | undefined }) {
  return (
    <>
      <rect x="1" y="1" width="58" height="122" rx="11" {...bodyFill(color)} stroke="currentColor" strokeOpacity={0.16} />
      <rect x="44" y="12" width="5" height="100" rx="2.5" className="fill-brand-foreground" fillOpacity={0.12} />
      <rect x="7" y="7" width="21" height="31" rx="7" className="fill-foreground" fillOpacity={0.14} />
      <circle cx="17.5" cy="15.5" r="4.4" className="fill-foreground stroke-brand-foreground" strokeOpacity={0.3} strokeWidth={0.8} />
      <circle cx="17.5" cy="29" r="4.4" className="fill-foreground stroke-brand-foreground" strokeOpacity={0.3} strokeWidth={0.8} />
      <circle cx="24.5" cy="22.3" r="1.4" className="fill-brand-foreground" fillOpacity={0.75} />
    </>
  );
}

/** Up to two colour swatches (64 x 64 units); a clear swatch for colourless items (clear cases, glass). */
function Swatches({ colors }: { colors: readonly string[] }) {
  if (colors.length === 0) {
    return (
      <g transform="translate(46 62) rotate(-6 34 34) scale(1.06)">
        <rect x="1" y="1" width="62" height="62" rx="16" className="fill-surface" fillOpacity={0.6} stroke="currentColor" strokeOpacity={0.22} />
        <path d="M14 40 40 14M22 48 48 22" stroke="currentColor" strokeOpacity={0.12} strokeWidth={3} strokeLinecap="round" />
      </g>
    );
  }

  if (colors.length === 1) {
    return (
      <g transform="translate(46 62) rotate(-6 34 34) scale(1.06)">
        <Swatch color={colors[0]} />
      </g>
    );
  }

  return (
    <>
      <g transform="translate(62 54) rotate(12 32 32)">
        <Swatch color={colors[1]} />
      </g>
      <g transform="translate(36 70) rotate(-7 32 32)">
        <Swatch color={colors[0]} />
      </g>
    </>
  );
}

function Swatch({ color }: { color: string }) {
  return (
    <>
      <rect x="1" y="1" width="62" height="62" rx="16" style={{ fill: color }} stroke="currentColor" strokeOpacity={0.14} />
      <rect x="6" y="6" width="52" height="20" rx="10" className="fill-brand-foreground" fillOpacity={0.14} />
    </>
  );
}
