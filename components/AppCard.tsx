import { ChevronDown } from "lucide-react";
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
  collapsible,
  className,
  children,
}: {
  title: React.ReactNode;
  step?: number;
  action?: React.ReactNode;
  helper?: React.ReactNode;
  tone?: "surface" | "purple";
  /**
   * Makes the card collapsible. The chevron button in the header is the only trigger. When closed, the body is hidden
   * and not focusable, and `summary` (a short line of plain text, never colour only) is shown under the title.
   */
  collapsible?: { open: boolean; onOpenChange: (open: boolean) => void; summary: React.ReactNode; label: string };
  className?: string;
  children?: React.ReactNode;
}) {
  const headingId = useId();
  const bodyId = useId();
  const purple = tone === "purple";
  const open = collapsible ? collapsible.open : true;
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
        {action && open && <div className="ml-auto">{action}</div>}
        {collapsible && (
          <button
            type="button"
            onClick={() => collapsible.onOpenChange(!open)}
            aria-expanded={open}
            aria-controls={bodyId}
            aria-label={`${open ? "Collapse" : "Expand"} ${collapsible.label}`}
            className={cn(
              "ml-auto flex size-9 shrink-0 items-center justify-center rounded-[10px] border-2",
              purple ? "border-brand-secondary text-brand-secondary hover:bg-brand-secondary/15" : "border-surface-border text-ink hover:bg-muted",
              action && open && "ml-0",
            )}
          >
            <ChevronDown aria-hidden="true" className={cn("size-5 transition-transform duration-200 motion-reduce:transition-none", open && "rotate-180")} />
          </button>
        )}
      </div>
      {collapsible && !open && <p className="-mt-2 text-sm text-ink-2 [.purple-card_&]:text-purple-body">{collapsible.summary}</p>}
      {collapsible ? (
        // grid-template-rows animates the height. inert keeps closed content out of the tab order and away from screen readers.
        <div
          id={bodyId}
          inert={!open}
          className={cn(
            "grid transition-[grid-template-rows] duration-200 motion-reduce:transition-none",
            open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
          )}
        >
          <div className="min-h-0 overflow-hidden">
            <div className="flex flex-col gap-4 p-2 -m-2">
              {children}
              {helper && <p className="text-[13px] text-ink-2 [.purple-card_&]:text-purple-body">{helper}</p>}
            </div>
          </div>
        </div>
      ) : (
        <>
          {children}
          {helper && <p className="text-[13px] text-ink-2 [.purple-card_&]:text-purple-body">{helper}</p>}
        </>
      )}
    </section>
  );
}
