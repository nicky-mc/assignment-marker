"use client";

import { rubricStatusAction } from "@/lib/rubricAdmin/actions";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Approve and Retire change what is live for marking, so they never happen on a single click:
// the button opens a dialog in plain words, and only its confirm button runs the existing action.
export default function StatusActionDialog({
  intent,
  rubricId,
  version,
  triggerLabel,
  title,
  description,
  confirmLabel,
  triggerClassName,
}: {
  intent: "approve" | "retire";
  rubricId: string;
  version: number;
  triggerLabel: string;
  title: string;
  description: string;
  confirmLabel: string;
  triggerClassName?: string;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger className={cn(buttonVariants({ variant: "outline", size: "sm" }), triggerClassName)}>
        {triggerLabel}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <form action={rubricStatusAction}>
            <input type="hidden" name="intent" value={intent} />
            <input type="hidden" name="id" value={rubricId} />
            <input type="hidden" name="version" value={version} />
            <Button type="submit">{confirmLabel}</Button>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
