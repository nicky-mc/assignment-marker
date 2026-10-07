"use client";

import { buttonVariants } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import TryDraft from "./TryDraft";

// Opens the existing draft-marking panel in a side sheet.
export default function TryDraftSheet({ rubricId, version, triggerClassName }: { rubricId: string; version: number; triggerClassName?: string }) {
  return (
    <Sheet>
      <SheetTrigger className={cn(buttonVariants({ variant: "outline", size: "sm" }), triggerClassName)}>Try draft</SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Try the draft</SheetTitle>
          <SheetDescription>Mark a made-up sample against draft version {version}. Real marking is not affected.</SheetDescription>
        </SheetHeader>
        <div className="px-4 pb-6">
          <TryDraft rubricId={rubricId} version={version} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
