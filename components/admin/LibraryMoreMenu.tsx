"use client";

import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// Admin-only "More" menu in the library header: the existing import page and the existing export route.
export default function LibraryMoreMenu({ triggerClassName }: { triggerClassName?: string }) {
  return (
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
