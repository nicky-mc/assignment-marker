import { CircleAlert, Info, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

const VARIANTS = {
  // Amber: the same token pair as the Draft badge.
  warning: { Icon: TriangleAlert, box: "border-draft-ink bg-draft text-draft-ink", title: "", role: "status" as const },
  error: { Icon: CircleAlert, box: "border-danger bg-surface text-ink", title: "text-danger", role: "alert" as const },
  info: { Icon: Info, box: "border-surface-border bg-surface text-ink", title: "", role: "status" as const },
};

// A proper notice: icon, short title, text. Never colour alone. role="status" for warnings and info, role="alert" for errors.
export default function Alert({
  variant = "warning",
  title,
  role,
  className,
  children,
}: {
  variant?: keyof typeof VARIANTS;
  title: string;
  role?: "status" | "alert";
  className?: string;
  children?: React.ReactNode;
}) {
  const v = VARIANTS[variant];
  return (
    <div role={role ?? v.role} className={cn("flex items-start gap-3 rounded-[10px] border-2 px-4 py-3", v.box, className)}>
      <v.Icon aria-hidden="true" className={cn("mt-0.5 size-5 shrink-0", variant === "error" && "text-danger")} />
      <div className="min-w-0 flex-1">
        <p className={cn("font-semibold", v.title)}>{title}</p>
        {children && <div className="text-sm">{children}</div>}
      </div>
    </div>
  );
}
