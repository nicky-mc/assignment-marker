import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface Crumb {
  label: string;
  href?: string;
}

// The last item is the current page. Links keep a 24px minimum target.
export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-x-1 gap-y-1 text-sm text-ink-2">
        {items.map((c, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${i}-${c.label}`} className="flex items-center gap-1">
              {last || !c.href ? (
                <span aria-current={last ? "page" : undefined} className="inline-flex min-h-6 items-center px-1 font-medium text-ink">
                  {c.label}
                </span>
              ) : (
                <Link href={c.href} className="inline-flex min-h-6 items-center rounded-md px-1 hover:bg-hover hover:text-ink">
                  {c.label}
                </Link>
              )}
              {!last && <ChevronRight aria-hidden="true" className="size-4" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
