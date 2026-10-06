"use client";

import type { RubricWarning } from "@/lib/rubricAdmin/validate";

export const PRIMARY_BUTTON =
  "rounded-md bg-brand-primary text-brand-secondary px-4 py-2 font-medium disabled:opacity-40 " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary dark:focus-visible:outline-brand-secondary";

export function FormMessage({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-md border-2 border-red-700 px-3 py-2 text-base font-medium max-w-[70ch]">
      {message}
    </p>
  );
}

// Instruction-like phrases are a warning, not a block. The admin must tick the box before a flagged draft is saved.
export function WarningPanel({ warnings, error }: { warnings: RubricWarning[]; error?: string }) {
  if (warnings.length === 0) return null;
  const phrases = Array.from(new Set(warnings.map((w) => `"${w.phrase}"`))).join(", ");
  const fields = Array.from(new Set(warnings.map((w) => w.field.replace("bandDescriptions.", "band ")))).join(", ");
  return (
    <div className="flex flex-col gap-2 rounded-md border-2 border-amber-700 bg-amber-50 text-amber-950 px-3 py-3 max-w-[70ch]" role="status">
      <p className="font-semibold">Please read this before saving</p>
      <p className="text-base">
        This text contains wording that can look like an instruction to the AI ({phrases}), in: {fields}. Rubric
        text goes straight into the marking prompt, so it should only describe the assignment.
      </p>
      <label className="flex items-start gap-2 text-base">
        <input
          type="checkbox"
          name="acknowledged"
          value="yes"
          className="mt-1 w-5 h-5 accent-brand-primary"
          aria-describedby={error ? "ack-error" : undefined}
        />
        I have read this and it only describes the assignment
      </label>
      {error && (
        <p id="ack-error" role="alert" className="text-sm font-semibold text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
