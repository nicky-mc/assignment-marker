"use client";

import { useId } from "react";

const INPUT =
  "w-full max-w-[70ch] border border-brand-primary/40 rounded-md px-3 py-2 text-base bg-white text-brand-primary " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary dark:focus-visible:outline-brand-secondary " +
  "aria-[invalid=true]:border-red-700 aria-[invalid=true]:border-2 read-only:bg-gray-100 read-only:text-gray-700";

// A labelled field with an optional hint, a live character count against its limit, and an error that
// is announced to screen readers. Used by every admin form.
export default function Field({
  name,
  label,
  hint,
  limit,
  error,
  value,
  onChange,
  rows,
  readOnly,
  options,
  placeholder,
}: {
  name: string;
  label: string;
  hint?: string;
  limit?: number;
  error?: string;
  value: string;
  onChange?: (v: string) => void;
  rows?: number;
  readOnly?: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
}) {
  const uid = useId();
  const id = `${uid}-${name}`;
  const hintId = `${id}-hint`;
  const countId = `${id}-count`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : "", limit ? countId : "", error ? errorId : ""].filter(Boolean).join(" ") || undefined;
  const over = limit !== undefined && value.trim().length > limit;
  const common = {
    id,
    name,
    value,
    readOnly,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": describedBy,
    className: INPUT,
  } as const;

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="font-medium text-base">
        {label}
      </label>
      {hint && (
        <p id={hintId} className="text-sm max-w-[70ch]">
          {hint}
        </p>
      )}
      {options ? (
        <select {...common} onChange={(e) => onChange?.(e.target.value)} disabled={readOnly}>
          <option value="">Choose...</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : rows ? (
        <textarea {...common} rows={rows} placeholder={placeholder} onChange={(e) => onChange?.(e.target.value)} />
      ) : (
        <input {...common} type="text" placeholder={placeholder} onChange={(e) => onChange?.(e.target.value)} />
      )}
      {limit !== undefined && (
        <p id={countId} className={`text-sm ${over ? "font-semibold text-red-700 dark:text-red-400" : ""}`}>
          {value.trim().length} of {limit} characters
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-sm font-semibold text-red-700 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
