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
import { Input } from "@/components/ui/input";
import { deleteRubricAction } from "@/lib/rubricAdmin/deleteActions";
import { cn } from "@/lib/utils";

// Admin-only "More" menu on a rubric page. Delete is blocked while a live version exists, and otherwise
// needs a confirmation (and, for a rubric that was ever live, typing its id). Nothing happens on a single click.
export default function RubricMoreMenu({
  rubricId,
  title,
  liveVersion,
  everLive,
  triggerClassName,
}: {
  rubricId: string;
  title: string;
  liveVersion: number | null;
  everLive: boolean;
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const blocked = liveVersion !== null;
  const needsId = everLive;
  const canDelete = !needsId || typed.trim() === rubricId;

  function remove() {
    setError(null);
    startTransition(async () => {
      // On success the action redirects to the library with a message.
      const r = await deleteRubricAction(rubricId);
      if (!r.ok) {
        setError(r.message);
        toast.error(r.message);
      }
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className={cn(buttonVariants({ variant: "outline", size: "sm" }), triggerClassName)}>
          <MoreHorizontal aria-hidden="true" />
          More
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-auto min-w-64 max-w-[calc(100vw-2rem)] border-2 border-border p-2">
          <DropdownMenuItem
            variant="destructive"
            disabled={blocked}
            className="min-h-10 px-2 text-base"
            onClick={() => {
              setTyped("");
              setError(null);
              setOpen(true);
            }}
          >
            Delete rubric...
          </DropdownMenuItem>
          {blocked && <p className="max-w-64 px-2 pb-1 text-[13px] text-ink-2">Retire it first. Deleting a live rubric would remove it from marking straight away.</p>}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this rubric permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes every version of {title} from the library and the Course dropdown. A copy is kept in the audit log. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {needsId && (
            <div className="flex flex-col gap-1">
              <label htmlFor="confirm-rubric-id" className="font-medium">
                Type the rubric id to confirm: <span className="break-all font-mono">{rubricId}</span>
              </label>
              <Input id="confirm-rubric-id" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" />
            </div>
          )}
          {error && (
            <p role="alert" className="text-sm font-semibold text-danger">
              {error}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button type="button" variant="destructive" onClick={remove} disabled={pending || !canDelete}>
              {pending ? "Deleting..." : "Delete rubric"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
