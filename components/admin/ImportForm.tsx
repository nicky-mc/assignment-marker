"use client";

import { useActionState, useState } from "react";
import { Download } from "lucide-react";
import { AppCard } from "@/components/AppCard";
import { Button, buttonVariants } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { importAction } from "@/lib/rubricAdmin/actions";
import { EMPTY_STATE } from "@/lib/rubricAdmin/formState";
import { cn } from "@/lib/utils";
import { WarningPanel } from "./FormParts";

// The existing import action, shown as four steps. Imports always land as drafts.
export default function ImportForm() {
  const [state, formAction, pending] = useActionState(importAction, EMPTY_STATE);
  const [json, setJson] = useState("");
  const errors = Object.entries(state.errors ?? {}).filter(([k]) => k !== "acknowledged");
  const shown = json || state.values?.json || "";

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <AppCard step={1} title="Download the template" helper="Fill it in, or edit an export. Each rubric needs an id, course, week, title, overview, requirements and stretch goal.">
        <div>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- a file download, not a page */}
          <a href="/admin/rubrics/export?template=1" className={cn(buttonVariants({ variant: "outline" }), "w-fit")}>
            <Download aria-hidden="true" />
            Download blank template
          </a>
        </div>
      </AppCard>

      <AppCard step={2} title={<label htmlFor="import-json">Paste or upload</label>}>
        <Textarea id="import-json" name="json" rows={12} value={shown} onChange={(e) => setJson(e.target.value)} />
        <div className="flex flex-col gap-1">
          <label htmlFor="import-file" className="font-medium">
            Or choose a .json file
          </label>
          <input id="import-file" name="file" type="file" accept=".json,application/json" className="text-base" />
        </div>
      </AppCard>

      <AppCard step={3} title="Review errors">
        {state.message && (
          <p role="alert" className="rounded-[10px] border-2 border-danger px-3 py-2 text-sm font-medium text-danger">
            {state.message}
          </p>
        )}
        {errors.length > 0 ? (
          <div role="alert" className="rounded-[10px] border-2 border-danger px-3 py-2">
            <p className="font-semibold text-danger">Please fix these, then save again:</p>
            <ul className="list-disc pl-5 text-sm">
              {errors.map(([field, msg]) => (
                <li key={field}>
                  <span className="font-medium">{field}:</span> {msg}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          !state.message && <p className="text-sm">Any problems found are listed here after you save.</p>
        )}
        <WarningPanel warnings={state.warnings ?? []} error={state.errors?.acknowledged} />
      </AppCard>

      <AppCard step={4} title="Save as draft" helper="Nothing goes live until it is approved. If an id already exists, a new draft version of that rubric is created.">
        <div>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving..." : "Save as draft"}
          </Button>
        </div>
      </AppCard>
    </form>
  );
}
