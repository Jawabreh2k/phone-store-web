import Link from "next/link";
import { ArrowIcon } from "@/components/ui/icons";
import { buttonSecondary, eyebrow as eyebrowText, sectionTitle } from "@/components/ui/ui";

interface Props {
  /** Heading id, so the section can be labelled by it and the "view all" link described by it. */
  id: string;
  title: string;
  /** Small line above the title, marked with the logo's accent dot. */
  eyebrow?: string;
  href?: string;
  linkLabel?: string;
}

/** Heading row for a page section: eyebrow and title, with an optional "view all" link on the end side. */
export function SectionHeading({ id, title, eyebrow, href, linkLabel }: Props) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div className="flex min-w-0 flex-col gap-2">
        {eyebrow && (
          <p className={`${eyebrowText} flex items-center gap-2`}>
            <span aria-hidden className="size-1.5 rounded-full bg-accent" />
            {eyebrow}
          </p>
        )}
        <h2 id={id} className={sectionTitle}>
          {title}
        </h2>
      </div>
      {href && linkLabel && (
        // Several sections say "View all"; the heading tells screen readers which one.
        <Link href={href} aria-describedby={id} className={`${buttonSecondary} shrink-0`}>
          {linkLabel}
          <ArrowIcon />
        </Link>
      )}
    </div>
  );
}
