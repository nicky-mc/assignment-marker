import SiteHeader from "@/components/SiteHeader";
import { cn } from "@/lib/utils";

// One container for the header and the page. Narrow (720px): marking page, sign-in and access pages.
// Wide (1040px): library, rubric detail and users. The widths are tokens in app/globals.css.
export default function PageShell({
  width = "narrow",
  hideLogo,
  className,
  children,
}: {
  width?: "narrow" | "wide";
  hideLogo?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("mx-auto flex w-full flex-1 flex-col px-6", width === "wide" ? "max-w-wide" : "max-w-narrow")}>
      <SiteHeader hideLogo={hideLogo} />
      <main id="main-content" tabIndex={-1} className={cn("flex flex-1 flex-col gap-4 pt-6 pb-16 outline-none", className)}>
        {children}
      </main>
    </div>
  );
}
