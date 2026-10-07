"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Pencil, Plus, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { AppCard } from "./AppCard";
import CourseMenu from "./admin/CourseMenu";
import { StatusBadge } from "./StatusBadge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useDragScroll } from "./useDragScroll";
import type { LibraryItem } from "@/lib/rubricStore";

type Filter = "all" | "live" | "drafts" | "retired";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "live", label: "Live" },
  { id: "drafts", label: "Drafts" },
  { id: "retired", label: "Retired" },
];

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

function RubricCard({ item, admin }: { item: LibraryItem; admin: boolean }) {
  return (
    <Link
      href={`/rubrics/${encodeURIComponent(item.id)}`}
      className="flex h-full min-h-44 flex-col gap-2 rounded-[14px] border-2 border-brand-primary bg-brand-primary p-4 transition-all duration-150 hover:-translate-y-0.5 hover:border-brand-secondary motion-reduce:hover:translate-y-0 dark:border-surface-border dark:hover:border-brand-secondary"
    >
      <span className="text-[12px] text-purple-body">{item.week}</span>
      <span className="line-clamp-3 font-heading text-[16px] leading-snug font-semibold text-purple-title">{item.title}</span>
      <span className="line-clamp-2 text-[13px] text-purple-body">{item.overview}</span>
      <span className="mt-auto flex flex-wrap items-center gap-2 pt-1">
        <StatusBadge status={item.status} version={item.version} admin={admin} onPurple />
        {admin && item.draftPending && (
          <span className="inline-flex items-center gap-1 text-[12px] text-purple-body">
            <Pencil className="size-3" aria-hidden="true" />
            Draft pending
          </span>
        )}
      </span>
    </Link>
  );
}

// The last card in an admin's row: a dashed card that starts a new rubric in this course. It is a link (so Enter works),
// and Space is added so it behaves like a button. A mouse drag never triggers it: useDragScroll cancels the click after a drag.
function AddAssignmentCard({ courseId, courseName }: { courseId: string; courseName: string }) {
  const router = useRouter();
  const href = `/rubrics/new?course=${encodeURIComponent(courseId)}`;
  return (
    <Link
      href={href}
      role="button"
      onKeyDown={(e) => {
        if (e.key === " ") {
          e.preventDefault();
          router.push(href);
        }
      }}
      className="flex h-full min-h-44 flex-col items-center justify-center gap-2 rounded-[14px] border-2 border-dashed border-surface-border bg-transparent p-4 text-center transition-all duration-150 hover:-translate-y-0.5 hover:bg-muted motion-reduce:hover:translate-y-0"
    >
      <Plus className="size-6" aria-hidden="true" />
      <span className="font-heading font-semibold">Add assignment</span>
      <span className="text-[13px] text-ink-2">to {courseName}</span>
    </Link>
  );
}

function CourseRow({ courseId, name, items, all, admin, canEdit }: { courseId: string; name: string; items: LibraryItem[]; all: LibraryItem[]; admin: boolean; canEdit: boolean }) {
  const scroller = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const headingId = `course-heading-${courseId}`;
  useDragScroll(scroller);

  // Previous and Next are disabled at the start and end; kept up to date on scroll and on resize.
  const update = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 1);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    update();
    el.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, [update, items.length]);

  // One card at a time (card width plus the 16px gap). Instant when the visitor prefers reduced motion.
  function scrollBy(direction: 1 | -1, enabled: boolean) {
    const el = scroller.current;
    if (!el || !enabled) return;
    const card = el.querySelector("li");
    const step = (card?.getBoundingClientRect().width ?? el.clientWidth * 0.8) + 16;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: direction * step, behavior: reduce ? "auto" : "smooth" });
  }

  const live = all.filter((i) => i.status === "approved").length;
  const drafts = all.filter((i) => i.hasDraft).length;
  const retired = all.filter((i) => i.status === "retired").length;
  const counts = admin
    ? [
        plural(all.length, "assignment"),
        live > 0 ? `${live} live` : "",
        drafts > 0 ? plural(drafts, "draft") : "",
        retired > 0 ? `${retired} retired` : "",
      ]
        .filter(Boolean)
        .join(", ")
    : plural(all.length, "assignment");

  return (
    <section id={`course-${courseId}`} aria-labelledby={headingId} className="flex scroll-mt-4 flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <h2 id={headingId} className="font-heading text-[18px] font-semibold">
            {name}
          </h2>
          <p className="text-[13px] text-ink-2">{counts}</p>
        </div>
        <div className="flex gap-2">
          {canEdit && <CourseMenu courseId={courseId} courseName={name} hasRubrics={all.length > 0} />}
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => scrollBy(-1, canPrev)}
            aria-disabled={!canPrev}
            aria-label={`Previous assignments in ${name}`}
            className="aria-disabled:cursor-not-allowed aria-disabled:opacity-40 aria-disabled:hover:bg-transparent"
          >
            <ChevronLeft aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => scrollBy(1, canNext)}
            aria-disabled={!canNext}
            aria-label={`Next assignments in ${name}`}
            className="aria-disabled:cursor-not-allowed aria-disabled:opacity-40 aria-disabled:hover:bg-transparent"
          >
            <ChevronRight aria-hidden="true" />
          </Button>
        </div>
      </div>
      {/* A horizontally scrolling row. Native scrolling and scroll-snap keep swipe, trackpad and keyboard working;
          mouse drag is added by useDragScroll. Padding and scroll-padding keep the focus ring from being clipped. */}
      <div
        ref={scroller}
        role="region"
        aria-label={`${name} assignments`}
        tabIndex={0}
        className="scroll-row -mx-2 snap-x snap-proximity overflow-x-auto scroll-smooth px-2 pt-2 pb-3 [scroll-padding-inline:0.5rem] motion-reduce:scroll-auto"
      >
        <ul className="flex gap-4">
          {items.map((item) => (
            <li key={item.id} className="w-64 shrink-0 snap-start sm:w-72">
              <RubricCard item={item} admin={admin} />
            </li>
          ))}
          {canEdit && (
            <li className="w-64 shrink-0 snap-start sm:w-72">
              <AddAssignmentCard courseId={courseId} courseName={name} />
            </li>
          )}
        </ul>
      </div>
    </section>
  );
}

export default function RubricLibrary({
  items,
  admin,
  canEdit = false,
  emptyCourses = [],
}: {
  items: LibraryItem[];
  admin: boolean;
  /** Admins reading from the database: shows the Add assignment card. */
  canEdit?: boolean;
  /** Courses with no rubrics yet, so an admin can add the first one. */
  emptyCourses?: { id: string; name: string }[];
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const courses = useMemo(() => {
    const map = new Map<string, { name: string; all: LibraryItem[] }>();
    for (const i of items) {
      const c = map.get(i.courseId) ?? { name: i.courseName, all: [] };
      c.all.push(i);
      map.set(i.courseId, c);
    }
    if (canEdit) for (const c of emptyCourses) if (!map.has(c.id)) map.set(c.id, { name: c.name, all: [] });
    return Array.from(map, ([id, c]) => ({ id, ...c }));
  }, [items, canEdit, emptyCourses]);

  const q = query.trim().toLowerCase();
  const matches = (i: LibraryItem) => {
    if (q && !`${i.title} ${i.overview} ${i.week}`.toLowerCase().includes(q)) return false;
    if (!admin || filter === "all") return true;
    if (filter === "live") return i.status === "approved";
    if (filter === "drafts") return i.hasDraft;
    return i.status === "retired";
  };

  // Courses with no rubrics yet stay visible (only when nothing is being searched or filtered) so an admin can add the first one.
  const filtering = Boolean(q) || (admin && filter !== "all");
  const rows = courses
    .map((c) => ({ ...c, shown: c.all.filter(matches) }))
    .filter((c) => c.shown.length > 0 || (canEdit && c.all.length === 0 && !filtering));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex min-w-56 flex-1 flex-col gap-1">
          <label htmlFor="rubric-search" className="font-medium">
            Search rubrics
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-2" aria-hidden="true" />
            <Input
              id="rubric-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Title, summary or week"
              className="h-10 pl-9"
            />
          </div>
        </div>
        {admin && (
          <div role="group" aria-label="Filter by status" className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <Button
                key={f.id}
                type="button"
                variant={filter === f.id ? "default" : "outline"}
                aria-pressed={filter === f.id}
                onClick={() => setFilter(f.id)}
              >
                {f.label}
              </Button>
            ))}
          </div>
        )}
      </div>

      {items.length === 0 && !(canEdit && emptyCourses.length > 0) ? (
        <AppCard title="No rubrics yet">
          <p>{admin ? "No rubrics have been added yet." : "There are no live rubrics yet. Please ask an admin."}</p>
        </AppCard>
      ) : rows.length === 0 ? (
        <AppCard title="No rubrics match">
          <p>
            Nothing matches{q ? ` "${query.trim()}"` : ""}
            {admin && filter !== "all" ? ` in ${FILTERS.find((f) => f.id === filter)?.label}` : ""}. Clear the search or choose a different filter.
          </p>
          <div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setQuery("");
                setFilter("all");
              }}
            >
              Clear search and filter
            </Button>
          </div>
        </AppCard>
      ) : (
        rows.map((c) => <CourseRow key={c.id} courseId={c.id} name={c.name} items={c.shown} all={c.all} admin={admin} canEdit={canEdit} />)
      )}
    </div>
  );
}
