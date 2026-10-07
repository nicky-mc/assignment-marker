import { cn } from "@/lib/utils";

// The purple title card at the top of a page.
export function HeroCard({
  icon,
  title,
  children,
  className,
}: {
  icon?: React.ReactNode;
  title: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("purple-card flex flex-col gap-1 rounded-[14px] p-5", className)}>
      <div className="flex items-center gap-3">
        {icon}
        <h1 className="font-heading text-3xl font-semibold text-purple-title">{title}</h1>
      </div>
      {children && <p className="text-purple-body">{children}</p>}
    </div>
  );
}
