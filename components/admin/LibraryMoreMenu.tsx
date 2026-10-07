"use client";

import { useState } from "react";
import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { DeletionRow } from "@/lib/rubricAdmin/deleteStore";
import { cn } from "@/lib/utils";

const fmt = (iso: string) => new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });

// Admin-only "More" menu in the library header: import, export, and the read-only deletion log.
export default function LibraryMoreMenu({ triggerClassName, deletions }: { triggerClassName?: string; deletions: DeletionRow[] }) {
  const [logOpen, setLogOpen] = useState(false);
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className={cn(buttonVariants({ variant: "outline", size: "sm" }), triggerClassName)}>
          <MoreHorizontal aria-hidden="true" />
          More
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-auto min-w-48 border-2 border-border p-2">
          <DropdownMenuItem render={<Link href="/admin/rubrics/import" />} className="min-h-10 px-2 text-base">
            Import JSON
          </DropdownMenuItem>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- a file download, not a page */}
          <DropdownMenuItem render={<a href="/admin/rubrics/export?all=1" />} className="min-h-10 px-2 text-base">
            Export all (JSON)
          </DropdownMenuItem>
          <DropdownMenuItem className="min-h-10 px-2 text-base" onClick={() => setLogOpen(true)}>
            Deletion log
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Sheet open={logOpen} onOpenChange={setLogOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>Deletion log</SheetTitle>
            <SheetDescription>Rubrics and courses that were deleted, newest first. A full copy of each is kept.</SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-6">
            {deletions.length === 0 ? (
              <p>Nothing has been deleted.</p>
            ) : (
              <ol className="flex flex-col">
                {deletions.map((d) => (
                  <li key={d.id} className="relative border-l-2 border-surface-border pb-5 pl-5 last:pb-0">
                    <span aria-hidden="true" className="absolute top-1.5 -left-[7px] size-3 rounded-full border-2 border-surface-border bg-brand-secondary" />
                    <p className="break-words font-medium">
                      {d.kind === "course" ? "Course" : "Rubric"}: {d.title ?? d.rubric_id ?? d.course_id}
                    </p>
                    <p className="break-all text-[13px] text-ink-2">{d.kind === "course" ? d.course_id : d.rubric_id}</p>
                    <p className="text-[13px] text-ink-2">
                      deleted by {d.deleted_by ?? "unknown"}, {fmt(d.deleted_at)}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
