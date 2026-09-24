// Shared class names so every screen uses the same buttons, chips, panels and headings.
// Styling only: colours come from the tokens in globals.css, radii and shadows from its @theme scale.
// Controls are 36px with a mouse and 44px on touch screens (pointer-coarse).

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-full text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";

/** Main action on a screen (one per view). */
export const buttonPrimary = `${buttonBase} h-12 bg-brand px-7 text-brand-foreground hover:bg-brand/90`;

/** Main action on a brand-coloured surface (e.g. the home hero). */
export const buttonInverse = `${buttonBase} h-12 bg-brand-foreground px-7 text-brand hover:bg-brand-foreground/90`;

/** Secondary action: pagination, retry, back links. */
export const buttonSecondary = `${buttonBase} h-11 border border-border bg-surface px-5 text-foreground hover:border-foreground/40`;

/** Low-emphasis action next to other controls: "Clear all", "Continue shopping". */
export const buttonGhost = `${buttonBase} h-11 px-4 text-brand hover:bg-brand/5`;

/** Round icon-only control (gallery arrows, closing a sheet, removing a line). Always give it an aria-label. */
export const iconButton =
  "inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-foreground transition-colors hover:border-foreground/40 disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:size-4";

/** Compact stepper control for cart quantity (round, icon-centred). */
export const quantityButton =
  "inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-foreground transition-colors hover:border-foreground/40 disabled:cursor-not-allowed disabled:opacity-50 pointer-coarse:size-11 [&_svg]:block [&_svg]:size-4";

/** Filter / option pill. */
export const chip =
  "inline-flex h-9 shrink-0 items-center gap-2 rounded-full border px-4 text-sm transition-colors pointer-coarse:h-11";
export const chipIdle = `${chip} border-border bg-surface text-foreground hover:border-foreground/40`;
export const chipActive = `${chip} border-brand bg-brand text-brand-foreground`;

/** A radio or checkbox shown as a chip: a label with this class around a visually hidden (sr-only) input. */
export const chipChoice = `${chipIdle} cursor-pointer has-checked:border-brand has-checked:bg-brand has-checked:text-brand-foreground has-focus-visible:outline-2 has-focus-visible:outline-offset-3 has-focus-visible:outline-brand`;

/** Segmented control (the listing's product-type tabs); each segment is a link, the current one with aria-current="page". */
export const segmented = "grid auto-cols-fr grid-flow-col gap-1 rounded-full border border-border bg-surface p-1";
export const segment =
  "inline-flex h-9 items-center justify-center rounded-full px-4 text-sm font-medium whitespace-nowrap text-muted transition-colors hover:text-foreground aria-[current=page]:bg-brand aria-[current=page]:text-brand-foreground pointer-coarse:h-10";

/** An applied filter; the chip is a link that removes it (ends with a CloseIcon). */
export const chipRemovable = `${chip} border-brand/20 bg-brand/5 pe-3 font-medium text-brand hover:border-brand/45 [&_svg]:size-3.5`;

/** Colour choice: a ring around a round fill (swatchFill, colour set inline). aria-pressed marks the choice. */
export const swatch =
  "inline-flex size-11 shrink-0 items-center justify-center rounded-full p-1 ring-inset transition-shadow hover:ring-1 hover:ring-foreground/30 aria-pressed:ring-2 aria-pressed:ring-brand";
export const swatchFill = "size-full rounded-full ring-1 ring-inset ring-foreground/15";

/** Two-line option, e.g. storage over RAM. aria-pressed marks the choice. */
export const optionCard =
  "flex min-h-14 flex-col items-start justify-center gap-0.5 rounded-2xl border border-border bg-surface px-3.5 py-2 text-start transition-colors hover:border-foreground/40 aria-pressed:border-brand aria-pressed:bg-brand/5 aria-pressed:ring-1 aria-pressed:ring-inset aria-pressed:ring-brand";

/** Inline text action. */
export const textLink = "text-sm font-medium text-brand underline-offset-4 hover:underline";

/** Horizontal swipe row (filter chips, product photos on phones) without a visible scrollbar. */
export const swipeRow = "overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

/** Page heading (h1) below the hero. */
export const pageTitle = "text-[2rem] leading-[1.1] font-semibold tracking-tight sm:text-5xl";

/** Section heading (h2) on a page. */
export const sectionTitle = "text-[1.75rem] leading-[1.15] font-semibold tracking-tight sm:text-4xl";

/** Heading inside a panel. */
export const panelTitle = "text-lg font-semibold tracking-tight sm:text-xl";

/** Small quiet label above headings and next to prices. */
export const eyebrow = "text-xs font-medium text-muted";

/** Surface card: summaries, specs, form sections. */
export const panel = "rounded-card border border-border bg-surface";

/**
 * Indigo surface with the hero's grid colours (add bg-grid for the texture): the footer, the order confirmation,
 * and the category / "view all" tiles. Used sparingly, at most one per screen besides the footer.
 */
export const brandSurface =
  "bg-brand text-brand-foreground [--focus-ring:var(--brand-foreground)] [--grid-line:color-mix(in_srgb,var(--brand-foreground)_7%,transparent)]";

/**
 * A notice about the cart or an order (stock changed, save this link). Ink text on a light accent tint
 * (accent text on the tint would be under 4.5:1); lead with an accent AlertIcon.
 */
export const notice =
  "flex items-start gap-3 rounded-2xl border border-accent/25 bg-accent/5 px-4 py-3 text-sm leading-relaxed text-foreground [&>svg]:mt-0.5 [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-accent";

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
export const formSection = `flex flex-col gap-4 ${panel} p-5 sm:p-6`;

/** Section heading inside a form card. */
export const formSectionTitle = "text-lg font-semibold tracking-tight";

/** A native select styled as fieldInput; pair it with a ChevronDownIcon at end-4 (see SelectField). */
export const fieldSelect = `${fieldInput} cursor-pointer appearance-none pe-11 disabled:cursor-not-allowed`;

/**
 * Status label (Published, Draft, Low stock): ink text in a quiet pill, with a dot in the tone colour.
 * The words carry the meaning, so it never relies on colour alone.
 */
const badge =
  "inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 text-xs font-medium whitespace-nowrap text-foreground before:size-1.5 before:rounded-full";
export const badgeSuccess = `${badge} before:bg-success`;
export const badgeAccent = `${badge} before:bg-accent`;
export const badgeBrand = `${badge} before:bg-brand`;
export const badgeMuted = `${badge} text-muted before:bg-muted/60`;

/** Language tag inside a bilingual input ("EN", "ع"), at the input's start. */
export const langTag =
  "pointer-events-none absolute start-3 top-3 inline-flex h-6 min-w-8 items-center justify-center rounded-lg bg-foreground/5 px-1.5 text-[0.6875rem] font-semibold tracking-wide text-muted";

/** Dashed empty area inviting a first item (no options yet, drop photos here). */
export const emptyArea =
  "flex flex-col items-center gap-3 rounded-card border border-dashed border-foreground/20 bg-background/60 px-6 py-10 text-center";
