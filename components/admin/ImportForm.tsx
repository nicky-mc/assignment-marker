"use client";

import { useActionState, useState } from "react";
import { importAction } from "@/lib/rubricAdmin/actions";
import { EMPTY_STATE } from "@/lib/rubricAdmin/formState";
import Field from "./Field";
import { FormMessage, PRIMARY_BUTTON, WarningPanel } from "./FormParts";

export default function ImportForm() {
  const [state, formAction, pending] = useActionState(importAction, EMPTY_STATE);
  const [json, setJson] = useState("");
  const errors = Object.entries(state.errors ?? {}).filter(([k]) => k !== "acknowledged");
  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      <FormMessage message={state.message} />
      <Field name="json" label="Paste JSON" rows={12} value={json || state.values?.json || ""} onChange={setJson} />
      <div className="flex flex-col gap-1">
        <label htmlFor="import-file" className="font-medium text-base">
          Or choose a .json file
        </label>
        <input
          id="import-file"
          name="file"
          type="file"
          accept=".json,application/json"
          className="text-base"
        />
      </div>
      {errors.length > 0 && (
        <div role="alert" className="rounded-md border-2 border-danger px-3 py-2 max-w-[70ch]">
          <p className="font-semibold">Please fix these, then import again:</p>
          <ul className="list-disc pl-5 text-base">
            {errors.map(([field, msg]) => (
              <li key={field}>
                <span className="font-medium">{field}:</span> {msg}
              </li>
            ))}
          </ul>
        </div>
      )}
      <WarningPanel warnings={state.warnings ?? []} error={state.errors?.acknowledged} />
      <div>
        <button type="submit" className={PRIMARY_BUTTON} disabled={pending}>
          {pending ? "Importing..." : "Import as drafts"}
        </button>
      </div>
    </form>
  );
}
