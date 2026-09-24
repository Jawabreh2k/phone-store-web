import type { ReactNode } from "react";

interface Props {
  /** An icon or small illustration, shown in a soft indigo circle. */
  visual: ReactNode;
  title: string;
  body?: string;
  /** Buttons or links below the text. */
  children?: ReactNode;
  /** h1 when the state is the whole page (404, error); h2 inside a page (cart could not load). */
  as?: "h1" | "h2";
  /** Tone of the circle: brand for neutral states, accent for errors. */
  tone?: "brand" | "accent";
  role?: "alert";
}

/** A whole-page state (not found, error, nothing here yet): one calm panel with a visual, a heading and next steps. */
export function StatePanel({ visual, title, body, children, as: Heading = "h1", tone = "brand", role }: Props) {
  return (
    <div role={role} className="flex flex-col items-center gap-5 rounded-panel border border-border bg-surface px-6 py-16 text-center sm:py-24">
      <span aria-hidden className={`inline-flex size-24 items-center justify-center rounded-full ${tone === "accent" ? "bg-accent/10 text-accent" : "bg-brand/5 text-brand"}`}>
        {visual}
      </span>
      <Heading className="max-w-lg text-[1.75rem] leading-tight font-semibold tracking-tight sm:text-4xl">{title}</Heading>
      {body && <p className="max-w-md leading-relaxed text-muted">{body}</p>}
      {children && <div className="mt-2 flex flex-wrap justify-center gap-3">{children}</div>}
    </div>
  );
}
