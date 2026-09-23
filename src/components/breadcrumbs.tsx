import Link from "next/link";

interface Crumb {
  label: string;
  /** Omitted for the current page (the last crumb). */
  href?: string;
}

/** Where the page sits in the catalogue: Home / Phones / Galaxy S24. */
export function Breadcrumbs({ label, items }: { label: string; items: Crumb[] }) {
  return (
    <nav aria-label={label}>
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-2">
            {i > 0 && (
              <span aria-hidden className="text-border">
                /
              </span>
            )}
            {item.href ? (
              <Link href={item.href} className="rounded-sm transition-colors hover:text-foreground">
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="font-medium text-foreground">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
