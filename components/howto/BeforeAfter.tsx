import { anonymise } from "@/lib/anonymise";
import { ANONYMISING } from "@/content/how-to";
import { cn } from "@/lib/utils";

const PLACEHOLDER_RE = /(\[(?:NAME|EMAIL|PHONE|LINK|ID|ADDRESS|POSTCODE|BUSINESS|REDACTED)\])/;

// A tag that is shown on screen as text, so a missed detail is never marked by colour alone.
function Missed({ label, children }: { label: string; children: string }) {
  return (
    <span>
      <mark className="rounded-sm bg-draft px-1 font-semibold text-draft-ink underline decoration-wavy decoration-2 underline-offset-4 [overflow-wrap:anywhere]">{children}</mark>{" "}
      <span className="ml-1 inline-block rounded-full border-2 border-draft-ink px-1.5 py-0.5 align-middle text-[11px] leading-4 font-semibold text-ink">
        Not hidden: {label}
      </span>
    </span>
  );
}

function Placeholder({ children }: { children: string }) {
  return <span className="mx-0.5 inline-block rounded border border-surface-border bg-muted px-1 align-baseline text-[12px] leading-5 font-medium text-ink-2">{children}</span>;
}

// Splits text on the placeholders and on the details the example says are missed.
function render(text: string) {
  const missed = [...ANONYMISING.missed].sort((a, b) => b.text.length - a.text.length);
  let parts: (string | { missed: (typeof missed)[number] })[] = [text];
  for (const m of missed) {
    parts = parts.flatMap((p) =>
      typeof p === "string" ? p.split(m.text).flatMap((chunk, i, arr) => (i < arr.length - 1 ? [chunk, { missed: m }] : [chunk])) : [p],
    );
  }
  return parts.map((p, i) =>
    typeof p === "string" ? (
      p.split(PLACEHOLDER_RE).map((q, j) => (PLACEHOLDER_RE.test(q) ? <Placeholder key={`${i}-${j}`}>{q}</Placeholder> : <span key={`${i}-${j}`}>{q}</span>))
    ) : (
      <Missed key={i} label={p.missed.label}>
        {p.missed.text}
      </Missed>
    ),
  );
}

const BLOCK = "flex min-w-0 flex-col gap-2 rounded-[10px] border-2 border-surface-border bg-field p-4";

// Two blocks side by side (stacked on a phone). The "sends" text comes from the real anonymiser, run on invented text.
export default function BeforeAfter() {
  const after = anonymise(ANONYMISING.before).text;
  return (
    <div className="grid gap-4 min-[760px]:grid-cols-2">
      <div className={BLOCK}>
        <h3 className="font-heading text-lg font-semibold">{ANONYMISING.beforeLabel}</h3>
        <p className="text-base whitespace-pre-line break-words">{ANONYMISING.before}</p>
      </div>
      <div className={cn(BLOCK, "border-brand-primary dark:border-brand-secondary")}>
        <h3 className="font-heading text-lg font-semibold">{ANONYMISING.afterLabel}</h3>
        <p className="text-base leading-8 whitespace-pre-line break-words">{render(after)}</p>
      </div>
    </div>
  );
}
