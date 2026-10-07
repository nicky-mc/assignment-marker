import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
import HeaderMenu from "@/components/HeaderMenu";
import { cn } from "@/lib/utils";

// The header lives inside the page container (see PageShell), so its edges line up with the page below it.
// `hideLogo` is for the sign-in page, which shows a larger logo above its card instead.
export default function SiteHeader({ hideLogo = false }: { hideLogo?: boolean }) {
  return (
    <header className={cn("flex items-center gap-2 pt-4", hideLogo ? "justify-end" : "justify-between")}>
      {!hideLogo && <Logo />}
      <div className="flex items-center gap-2">
        <HeaderMenu />
        <ThemeToggle />
      </div>
    </header>
  );
}
