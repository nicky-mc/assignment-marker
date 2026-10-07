import { AppCard } from "@/components/AppCard";
import type { HistoryRow } from "@/lib/rubricAdmin/store";

const fmt = (iso: string) => new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });

const LABELS: Record<string, string> = {
  created: "Created",
  edited: "Edited",
  submitted: "Submitted for approval",
  approved: "Approved",
  retired: "Retired",
  imported: "Imported",
};

// Who did what and when, newest first, from rubric_history. Admins only (the caller decides).
export default function HistoryTimeline({ history }: { history: HistoryRow[] }) {
  return (
    <AppCard title="History">
      {history.length === 0 ? (
        <p>No history yet.</p>
      ) : (
        <ol className="flex flex-col">
          {history.map((h) => (
            <li key={h.id} className="relative border-l-2 border-surface-border pb-5 pl-5 last:pb-0">
              <span aria-hidden="true" className="absolute top-1.5 -left-[7px] size-3 rounded-full border-2 border-surface-border bg-brand-secondary" />
              <p className="font-medium">
                {LABELS[h.action] ?? h.action} <span className="font-normal">version {h.version}</span>
              </p>
              <p className="text-[13px] text-ink-2">
                {h.changed_by ?? "unknown"}, {fmt(h.changed_at)}
              </p>
            </li>
          ))}
        </ol>
      )}
    </AppCard>
  );
}
