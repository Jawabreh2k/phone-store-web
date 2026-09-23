// Shared class names so every screen uses the same buttons, chips and links.
// Styling only: colours come from the tokens in globals.css.

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-full text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";

/** Main action on a screen (one per view). */
export const buttonPrimary = `${buttonBase} h-12 bg-brand px-7 text-brand-foreground hover:bg-brand/90`;

/** Main action on a brand-coloured surface (e.g. the home hero). */
export const buttonInverse = `${buttonBase} h-12 bg-brand-foreground px-7 text-brand hover:bg-brand-foreground/90`;

/** Secondary action: pagination, retry, back links. */
export const buttonSecondary = `${buttonBase} h-11 border border-border bg-surface px-5 text-foreground hover:border-foreground/40`;

/** Compact stepper control for cart quantity (square, icon-centred). */
export const quantityButton =
  "inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-foreground transition-colors hover:border-foreground/40 disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:block [&_svg]:size-4";

/** Filter / option pill. */
export const chip =
  "inline-flex h-9 shrink-0 items-center gap-2 rounded-full border px-4 text-sm transition-colors";
export const chipIdle = `${chip} border-border bg-surface text-foreground hover:border-foreground/40`;
export const chipActive = `${chip} border-brand bg-brand text-brand-foreground`;

/** Inline text action. */
export const textLink = "text-sm font-medium text-brand underline-offset-4 hover:underline";

/** Horizontal swipe row (filter chips, product photos on phones) without a visible scrollbar. */
export const swipeRow = "overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

/** Small quiet label above headings and next to prices. */
export const eyebrow = "text-xs text-muted";

/** Form field label. */
export const fieldLabel = "text-sm font-medium text-foreground";

/** Text input and textarea shared styling. */
export const fieldInput =
  "w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-brand aria-invalid:border-accent";

/** Inline validation message below a field. */
export const fieldHint = "text-sm text-accent";

/** Label + control stack. */
export const fieldGroup = "flex flex-col gap-2";

/** Grouped form section in a card. */
export const formSection = "flex flex-col gap-4 rounded-[1.5rem] border border-border bg-surface p-5 sm:p-6";

/** Section heading inside a form card. */
export const formSectionTitle = "text-lg font-semibold tracking-tight";
