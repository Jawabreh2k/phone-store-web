import Link from "next/link";
import type { Dictionary } from "@/i18n/dictionaries";
import { t } from "@/lib/format";
import { ArrowIcon } from "./icons";
import { iconButton } from "./ui";

interface Props {
  page: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  /** The listing URL for a page number (keeps the current filters). */
  href: (page: number) => string;
  labels: Pick<Dictionary["catalog"], "pagination" | "page" | "previous" | "next" | "showing">;
}

/** First, last, and the current page with its neighbours; null is a gap ("…"). A gap of one page shows that page. */
function pageList(page: number, total: number): (number | null)[] {
  const wanted = [...new Set([1, page - 1, page, page + 1, total])].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const list: (number | null)[] = [];
  let previous = 0;
  for (const p of wanted) {
    if (p - previous === 2) list.push(previous + 1);
    else if (p - previous > 2) list.push(null);
    list.push(p);
    previous = p;
  }
  return list;
}

/** Numbered pages with previous / next, and "Showing 25–48 of 61". */
export function Pagination({ page, totalPages, totalCount, pageSize, href, labels }: Props) {
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalCount);
  const step = `${iconButton} [&_svg]:size-4`;

  return (
    <nav aria-label={labels.pagination} className="flex flex-col items-center gap-4 border-t border-border pt-8 sm:flex-row sm:justify-between">
      <p className="text-sm text-muted">{t(labels.showing, { from, to, total: totalCount })}</p>

      <ol className="flex items-center gap-1">
        <li>
          {page > 1 ? (
            <Link href={href(page - 1)} aria-label={labels.previous} className={step}>
              <ArrowIcon className="rotate-180" />
            </Link>
          ) : (
            <span aria-hidden className={`${step} opacity-40`}>
              <ArrowIcon className="rotate-180" />
            </span>
          )}
        </li>
        {pageList(page, totalPages).map((p, i) => (
          <li key={p ?? `gap-${i}`}>
            {p === null ? (
              <span aria-hidden className="inline-flex w-6 justify-center text-muted">
                …
              </span>
            ) : (
              <Link
                href={href(p)}
                aria-label={t(labels.page, { n: p })}
                aria-current={p === page ? "page" : undefined}
                className="inline-flex size-11 items-center justify-center rounded-full text-sm font-medium tabular-nums transition-colors hover:bg-foreground/5 aria-[current=page]:bg-brand aria-[current=page]:text-brand-foreground"
              >
                {p}
              </Link>
            )}
          </li>
        ))}
        <li>
          {page < totalPages ? (
            <Link href={href(page + 1)} aria-label={labels.next} className={step}>
              <ArrowIcon />
            </Link>
          ) : (
            <span aria-hidden className={`${step} opacity-40`}>
              <ArrowIcon />
            </span>
          )}
        </li>
      </ol>
    </nav>
  );
}
