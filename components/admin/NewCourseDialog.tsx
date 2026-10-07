"use client";

import { useActionState, useState } from "react";
import { createCourseAction } from "@/lib/rubricAdmin/actions";
import { EMPTY_STATE } from "@/lib/rubricAdmin/formState";
import { slugify } from "@/lib/rubricAdmin/slug";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

// New course: a name, with the id generated from it (editable under Advanced). Uses the existing action.
export default function NewCourseDialog({ triggerClassName }: { triggerClassName?: string }) {
  const [state, formAction, pending] = useActionState(createCourseAction, EMPTY_STATE);
  const [name, setName] = useState("");
  const [id, setId] = useState("");
  const [idTouched, setIdTouched] = useState(false);
  const shownId = idTouched ? id : slugify(name, 40);
  const err = state.errors ?? {};

  return (
    <Dialog>
      <DialogTrigger className={cn(buttonVariants({ variant: "outline", size: "sm" }), triggerClassName)}>New course</DialogTrigger>
      <DialogContent>
        <form action={formAction} className="flex flex-col gap-4" noValidate>
          <DialogHeader>
            <DialogTitle>New course</DialogTitle>
            <DialogDescription>The course appears in the Course dropdown after its first rubric is approved.</DialogDescription>
          </DialogHeader>
          {state.message && (
            <p role="alert" className="rounded-[10px] border-2 border-danger px-3 py-2 text-sm font-medium text-danger">
              {state.message}
            </p>
          )}
          <div className="flex flex-col gap-1">
            <label htmlFor="course-name" className="font-medium">
              Course name
            </label>
            <Input
              id="course-name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-invalid={err.name ? true : undefined}
              aria-describedby={err.name ? "course-name-error" : undefined}
            />
            <p className="text-[13px] text-ink-2">{name.trim().length} of 100 characters</p>
            {err.name && (
              <p id="course-name-error" role="alert" className="text-sm font-semibold text-danger">
                {err.name}
              </p>
            )}
          </div>
          <details className="rounded-[10px] border-2 border-surface-border px-3 py-2">
            <summary className="cursor-pointer font-medium">Advanced</summary>
            <div className="mt-2 flex flex-col gap-1">
              <label htmlFor="course-id" className="font-medium">
                Course id
              </label>
              <p className="text-[13px] text-ink-2">A lowercase slug, unique. It is made from the name, and you can change it before saving.</p>
              <Input
                id="course-id"
                name="id"
                value={shownId}
                onChange={(e) => {
                  setId(e.target.value);
                  setIdTouched(true);
                }}
                aria-invalid={err.id ? true : undefined}
                aria-describedby={err.id ? "course-id-error" : undefined}
              />
              {err.id && (
                <p id="course-id-error" role="alert" className="text-sm font-semibold text-danger">
                  {err.id}
                </p>
              )}
            </div>
          </details>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Creating..." : "Create course"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
