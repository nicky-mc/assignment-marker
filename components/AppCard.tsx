import { useId } from "react";
import { cn } from "@/lib/utils";

// The surface card. Anatomy: header row (optional step badge, h2 title, optional right-aligned action),
// then the body, then optional helper text. Use tone="purple" for the Course and Assignment card.
export function AppCard({
  title,
  step,
  action,
  helper,
  tone = "surface",
  className,
  children,
}: {
  title: React.ReactNode;
  step?: number;
  action?: React.ReactNode;
  helper?: React.ReactNode;
  tone?: "surface" | "purple";
  className?: string;
  children?: React.ReactNode;
}) {
  const headingId = useId();
  const purple = tone === "purple";
  return (
    <section
      aria-labelledby={headingId}
      className={cn(
        "flex flex-col gap-4 rounded-[14px] p-5",
        purple ? "purple-card" : "border-2 border-surface-border bg-surface text-ink",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-3">
        {step !== undefined && (
          <span
            className={cn(
              "flex size-6 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
              purple
                ? "bg-brand-secondary text-brand-primary"
                : "bg-brand-primary text-brand-secondary dark:bg-brand-secondary dark:text-brand-primary",
            )}
          >
            <span className="sr-only">Step </span>
            {step}
          </span>
        )}
        <h2 id={headingId} className="min-w-0 flex-1 font-heading text-[18px] leading-snug font-semibold">
          {title}
        </h2>
        {action && <div className="ml-auto">{action}</div>}
      </div>
      {children}
      {helper && <p className="text-[13px] text-ink-2 [.purple-card_&]:text-purple-body">{helper}</p>}
    </section>
  );
}
