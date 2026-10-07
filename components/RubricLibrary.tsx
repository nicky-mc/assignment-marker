"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Pencil, Search } from "lucide-react";
import { AppCard } from "./AppCard";
import { StatusBadge } from "./StatusBadge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
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

function CourseRow({ courseId, name, items, all, admin }: { courseId: string; name: string; items: LibraryItem[]; all: LibraryItem[]; admin: boolean }) {
  const scroller = useRef<HTMLDivElement>(null);
  const headingId = `course-heading-${courseId}`;

  function scrollBy(direction: 1 | -1) {
    const el = scroller.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: reduce ? "auto" : "smooth" });
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
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <h2 id={headingId} className="font-heading text-[18px] font-semibold">
            {name}
          </h2>
          <p className="text-[13px] text-ink-2">{counts}</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="icon" onClick={() => scrollBy(-1)} aria-label={`Previous assignments in ${name}`}>
            <ChevronLeft aria-hidden="true" />
          </Button>
          <Button type="button" variant="outline" size="icon" onClick={() => scrollBy(1)} aria-label={`Next assignments in ${name}`}>
            <ChevronRight aria-hidden="true" />
          </Button>
        </div>
      </div>
      {/* A horizontally scrolling row. Native scroll-snap keeps swipe, trackpad and keyboard working; a focused card scrolls into view. */}
      <div
        ref={scroller}
        role="region"
        aria-label={`${name} assignments`}
        tabIndex={0}
        className="-mx-1 overflow-x-auto scroll-smooth px-1 pt-1 pb-3 [scroll-padding-inline:0.25rem] motion-reduce:scroll-auto"
      >
        <ul className="flex snap-x snap-proximity gap-4">
          {items.map((item) => (
            <li key={item.id} className="w-64 shrink-0 snap-start sm:w-72">
              <RubricCard item={item} admin={admin} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default function RubricLibrary({ items, admin }: { items: LibraryItem[]; admin: boolean }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const courses = useMemo(() => {
    const map = new Map<string, { name: string; all: LibraryItem[] }>();
    for (const i of items) {
      const c = map.get(i.courseId) ?? { name: i.courseName, all: [] };
      c.all.push(i);
      map.set(i.courseId, c);
    }
    return Array.from(map, ([id, c]) => ({ id, ...c }));
  }, [items]);

  const q = query.trim().toLowerCase();
  const matches = (i: LibraryItem) => {
    if (q && !`${i.title} ${i.overview} ${i.week}`.toLowerCase().includes(q)) return false;
    if (!admin || filter === "all") return true;
    if (filter === "live") return i.status === "approved";
    if (filter === "drafts") return i.hasDraft;
    return i.status === "retired";
  };

  const rows = courses.map((c) => ({ ...c, shown: c.all.filter(matches) })).filter((c) => c.shown.length > 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex flex-1 flex-col gap-1">
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
              className="pl-9"
            />
          </div>
        </div>
        {admin && (
          <div role="group" aria-label="Filter by status" className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <Button
                key={f.id}
                type="button"
                size="sm"
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

      {items.length === 0 ? (
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
        rows.map((c) => <CourseRow key={c.id} courseId={c.id} name={c.name} items={c.shown} all={c.all} admin={admin} />)
      )}
    </div>
  );
}
