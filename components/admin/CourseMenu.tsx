"use client";

import { useState, useTransition } from "react";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { deleteCourseAction } from "@/lib/rubricAdmin/deleteActions";
import { cn } from "@/lib/utils";

// A small admin-only menu on a course header. "Delete course..." works only when the course has no rubrics.
export default function CourseMenu({ courseId, courseName, hasRubrics }: { courseId: string; courseName: string; hasRubrics: boolean }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function remove() {
    setError(null);
    startTransition(async () => {
      const r = await deleteCourseAction(courseId);
      if (!r.ok) {
        setError(r.message);
        toast.error(r.message);
      }
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className={cn(buttonVariants({ variant: "outline", size: "icon" }))} aria-label={`Course options for ${courseName}`}>
          <MoreHorizontal aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-auto min-w-56 max-w-[calc(100vw-2rem)] border-2 border-border p-2">
          <DropdownMenuItem variant="destructive" disabled={hasRubrics} className="min-h-10 px-2 text-base" onClick={() => setOpen(true)}>
            Delete course...
          </DropdownMenuItem>
          {hasRubrics && <p className="max-w-56 px-2 pb-1 text-[13px] text-ink-2">Only an empty course can be deleted.</p>}
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this empty course?</AlertDialogTitle>
            <AlertDialogDescription>
              {courseName} has no rubrics. A copy is kept in the audit log.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error && (
            <p role="alert" className="text-sm font-semibold text-danger">
              {error}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button type="button" variant="destructive" onClick={remove} disabled={pending}>
              {pending ? "Deleting..." : "Delete course"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
