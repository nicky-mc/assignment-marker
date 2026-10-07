import { cn } from "@/lib/utils";

// A two-or-more way switch built on native radio inputs, so arrow keys and screen readers work without extra code.
export default function SegmentedControl<T extends string>({
  label,
  name,
  value,
  onChange,
  options,
}: {
  label: string;
  name: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex w-fit rounded-[10px] border-2 border-field-border bg-field p-0.5">
      {options.map((o) => (
        <label key={o.value} className="relative">
          <input type="radio" name={name} value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} className="peer sr-only" />
          <span
            className={cn(
              "flex min-h-8 min-w-24 cursor-pointer items-center justify-center rounded-[8px] px-3 text-sm font-medium text-ink hover:bg-hover",
              "peer-checked:bg-brand-primary peer-checked:font-semibold peer-checked:text-brand-secondary peer-checked:hover:bg-brand-primary",
              "dark:peer-checked:bg-brand-secondary dark:peer-checked:text-brand-primary dark:peer-checked:hover:bg-brand-secondary",
              "peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring",
            )}
          >
            {o.label}
          </span>
        </label>
      ))}
    </div>
  );
}
