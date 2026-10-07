import { AppCard } from "@/components/AppCard";
import type { AccessHistoryRow } from "@/lib/userAdmin/store";

const fmt = (iso: string) => new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });

function describe(h: AccessHistoryRow): string {
  if (h.action === "added") return `${h.email} was added as ${h.new_role ?? "a user"}${h.changed_by === "self sign-up" ? " by self sign-up" : ""}`;
  if (h.action === "settings_changed") return `Staff sign-up changed from ${h.old_role ?? "unknown"} to ${h.new_role ?? "unknown"}`;
  if (h.action === "unblocked") return `${h.email} can be added by self sign-up again`;
  if (h.action === "role_changed") return `${h.email} changed from ${h.old_role} to ${h.new_role}`;
  return `${h.email} lost access (was ${h.old_role ?? "a user"})`;
}

// Who changed what and when, newest first.
export default function UserHistoryTimeline({ history }: { history: AccessHistoryRow[] }) {
  return (
    <AppCard title="History">
      {history.length === 0 ? (
        <p>No changes yet.</p>
      ) : (
        <ol className="flex flex-col">
          {history.map((h) => (
            <li key={h.id} className="relative border-l-2 border-surface-border pb-5 pl-5 last:pb-0">
              <span aria-hidden="true" className="absolute top-1.5 -left-[7px] size-3 rounded-full border-2 border-surface-border bg-brand-secondary" />
              <p className="break-words font-medium">{describe(h)}</p>
              <p className="text-[13px] text-ink-2">
                by {h.changed_by ?? "unknown"}, {fmt(h.changed_at)}
              </p>
            </li>
          ))}
        </ol>
      )}
    </AppCard>
  );
}
