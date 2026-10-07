import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

// Admin-screen styles, built from the same tokens as AppCard and Button (see "Design system" in AGENTS.md).
export const CARD = "flex flex-col gap-4 rounded-[14px] border-2 border-surface-border bg-surface p-5 text-ink";
export const LINK_BUTTON = cn(buttonVariants({ variant: "outline", size: "default" }), "w-fit");
export const SMALL_BUTTON = cn(buttonVariants({ variant: "outline", size: "sm" }), "w-fit");

export function Notice({ msg, error }: { msg?: string; error?: string }) {
  if (error) {
    return (
      <p role="alert" className="max-w-[70ch] rounded-[10px] border-2 border-danger px-3 py-2 font-medium text-danger">
        {error}
      </p>
    );
  }
  if (msg) {
    return (
      <p role="status" className="max-w-[70ch] rounded-[10px] border-2 border-surface-border px-3 py-2 font-medium">
        {msg}
      </p>
    );
  }
  return null;
}

export const fmtDate = (iso: string | null) => (iso ? new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : "");
