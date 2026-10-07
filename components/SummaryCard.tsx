import { cn } from "@/lib/utils";

// The green result summary card: purple text on green.
export function SummaryCard({
  heading,
  showHeading = false,
  className,
  children,
}: {
  heading: string;
  /** Show the heading as visible text (otherwise it is for screen readers only). */
  showHeading?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      aria-label={heading}
      className={cn("flex flex-col gap-3 rounded-[14px] bg-brand-secondary p-5 text-brand-primary", className)}
    >
      <h2 className={showHeading ? "font-heading text-[18px] font-semibold" : "sr-only"}>{heading}</h2>
      {children}
    </section>
  );
}

// A text badge for the summary card: purple fill, green text, with a text label so colour is never the only signal.
export function SummaryBadge({ glyph, children }: { glyph: string; children: React.ReactNode }) {
  return (
    <li className="inline-flex items-center gap-1.5 rounded-full bg-brand-primary px-3 py-1 text-sm font-semibold text-brand-secondary">
      <span aria-hidden="true">{glyph}</span>
      {children}
    </li>
  );
}
