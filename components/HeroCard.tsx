import { cn } from "@/lib/utils";

// The purple title card at the top of a page.
export function HeroCard({
  icon,
  title,
  eyebrow,
  aside,
  note,
  actions,
  children,
  className,
}: {
  icon?: React.ReactNode;
  title: React.ReactNode;
  /** A small label above the title, on the left (for example the week). */
  eyebrow?: React.ReactNode;
  /** Shown on the right of the eyebrow row (for example a status badge). */
  aside?: React.ReactNode;
  /** A quiet helper line at the bottom of the card. */
  note?: React.ReactNode;
  /** A row of buttons under the text. */
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("purple-card flex flex-col gap-2 rounded-[14px] p-5", className)}>
      {(eyebrow || aside) && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-base text-purple-body">{eyebrow}</span>
          {aside}
        </div>
      )}
      <div className="flex items-center gap-3">
        {icon}
        <h1 className="font-heading text-3xl font-semibold text-purple-title">{title}</h1>
      </div>
      {children && <p className="text-purple-body">{children}</p>}
      {note && <p className="text-[13px] text-purple-body">{note}</p>}
      {actions && <div className="mt-1 flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
