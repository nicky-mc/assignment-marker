import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/adminAccess";
import { rubricStatusAction } from "@/lib/rubricAdmin/actions";
import { getDetail, listCourseRows, rowToInput } from "@/lib/rubricAdmin/store";
import { stripBandPrefix } from "@/lib/rubricAdmin/validate";
import { BAND_DESCRIPTIONS } from "@/lib/rubrics";
import RubricForm from "@/components/admin/RubricForm";
import TryDraft from "@/components/admin/TryDraft";
import { CARD, fmtDate, LINK_BUTTON, Notice, SMALL_BUTTON } from "@/components/admin/ui";

function StatusButton({ intent, id, version, children }: { intent: string; id: string; version: number; children: React.ReactNode }) {
  return (
    <form action={rubricStatusAction}>
      <input type="hidden" name="intent" value={intent} />
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="version" value={version} />
      <button type="submit" className={SMALL_BUTTON}>
        {children}
      </button>
    </form>
  );
}

export default async function RubricAdminPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ msg?: string; error?: string }>;
}) {
  await requireAdmin();
  const { id: rawId } = await params;
  const id = decodeURIComponent(rawId);
  const { msg, error } = await searchParams;

  let detail: Awaited<ReturnType<typeof getDetail>>;
  let courses: Awaited<ReturnType<typeof listCourseRows>>;
  try {
    [detail, courses] = await Promise.all([getDetail(id), listCourseRows()]);
  } catch (err) {
    return <Notice error={err instanceof Error ? err.message : "Could not load the rubric."} />;
  }
  if (detail.versions.length === 0) notFound();

  const latest = detail.versions[0];
  const draft = detail.versions.find((v) => v.status === "draft");
  const input = rowToInput(latest);
  const bands = Array.from({ length: 5 }, (_, i) => stripBandPrefix(input.bandDescriptions?.[i] ?? ""));

  return (
    <>
      <h1 className="font-heading text-3xl font-semibold break-words">{latest.title}</h1>
      <p className="text-base break-all">
        {id} · {latest.course_name} · {latest.week}
      </p>
      <Notice msg={msg} error={error} />

      <section aria-labelledby="versions" className={CARD}>
        <h2 id="versions" className="font-heading text-xl font-semibold">
          Versions
        </h2>
        <ul className="flex flex-col gap-4">
          {detail.versions.map((v) => (
            <li key={v.version} className="flex flex-col gap-2 border-b border-brand-primary/15 pb-4">
              <p className="text-base">
                <span className="font-semibold">Version {v.version}</span>: <span className="font-medium">{v.status}</span>
                {v.status === "approved" ? " (live)" : ""}
                <span className="block text-sm">
                  Created by {v.created_by ?? "unknown"}, {fmtDate(v.created_at)}
                  {v.approved_by ? `. Approved by ${v.approved_by}, ${fmtDate(v.approved_at)}` : ""}
                </span>
              </p>
              <div className="flex flex-wrap gap-2">
                {v.status === "draft" && (
                  <>
                    <StatusButton intent="submit" id={id} version={v.version}>
                      Submit for approval
                    </StatusButton>
                    <StatusButton intent="approve" id={id} version={v.version}>
                      Approve
                    </StatusButton>
                  </>
                )}
                {v.status === "approved" && (
                  <StatusButton intent="retire" id={id} version={v.version}>
                    Retire
                  </StatusButton>
                )}
                <a href={`/admin/rubrics/export?id=${encodeURIComponent(id)}&version=${v.version}`} className={SMALL_BUTTON}>
                  Export JSON
                </a>
              </div>
            </li>
          ))}
        </ul>
        <p className="text-sm max-w-[70ch]">
          Approving a draft retires the previous approved version automatically. Nothing is ever deleted.
        </p>
      </section>

      <section aria-labelledby="edit" className={CARD}>
        <RubricForm
          mode="edit"
          courses={courses}
          initial={{
            id,
            courseId: latest.course_id,
            week: latest.week,
            title: latest.title,
            overview: latest.overview,
            requirements: latest.requirements,
            stretchGoal: latest.stretch_goal,
            bands,
          }}
          genericBands={BAND_DESCRIPTIONS.map(stripBandPrefix)}
          heading={draft ? `Edit draft (version ${draft.version})` : `Edit (creates a new draft, version ${latest.version + 1})`}
          note={
            draft
              ? "Saving updates this draft. It is not live until it is approved."
              : "Editing creates a new draft. The approved version stays live until the draft is approved."
          }
        />
      </section>

      {draft && (
        <section aria-labelledby="try" className={CARD}>
          <h2 id="try" className="font-heading text-xl font-semibold">
            Try the draft
          </h2>
          <TryDraft rubricId={id} version={draft.version} />
        </section>
      )}

      <section aria-labelledby="history" className={CARD}>
        <h2 id="history" className="font-heading text-xl font-semibold">
          History
        </h2>
        {detail.history.length === 0 ? (
          <p className="text-base">No history yet.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {detail.history.map((h) => (
              <li key={h.id} className="text-base">
                <span className="font-semibold">{h.action}</span> version {h.version} by {h.changed_by ?? "unknown"}, {fmtDate(h.changed_at)}
                <details className="text-sm">
                  <summary className="cursor-pointer w-fit underline focus-visible:outline-2 focus-visible:outline-offset-2">View snapshot</summary>
                  <pre className="whitespace-pre-wrap break-words max-w-[70ch] overflow-x-auto bg-brand-primary-tint dark:bg-background rounded-md p-3 mt-2">
                    {JSON.stringify(h.snapshot, null, 2)}
                  </pre>
                </details>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p>
        <Link href="/admin/rubrics" className={LINK_BUTTON}>
          Back to all rubrics
        </Link>
      </p>
    </>
  );
}
