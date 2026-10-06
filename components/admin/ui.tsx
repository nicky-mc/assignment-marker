export const CARD =
  "rounded-lg border-2 border-brand-primary dark:border-brand-secondary/50 bg-white dark:bg-brand-primary-tint text-foreground p-5 flex flex-col gap-4";
export const LINK_BUTTON =
  "inline-block rounded-md border-2 border-brand-primary dark:border-brand-secondary px-3 py-1.5 text-base font-medium " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary dark:focus-visible:outline-brand-secondary";
export const SMALL_BUTTON =
  "rounded-md border border-brand-primary/60 dark:border-brand-secondary/60 px-3 py-1.5 text-sm font-medium " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary dark:focus-visible:outline-brand-secondary";

export function Notice({ msg, error }: { msg?: string; error?: string }) {
  if (error) {
    return (
      <p role="alert" className="rounded-md border-2 border-red-700 px-3 py-2 font-medium max-w-[70ch]">
        {error}
      </p>
    );
  }
  if (msg) {
    return (
      <p role="status" className="rounded-md border-2 border-brand-primary dark:border-brand-secondary px-3 py-2 font-medium max-w-[70ch]">
        {msg}
      </p>
    );
  }
  return null;
}

export const fmtDate = (iso: string | null) => (iso ? new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : "");
