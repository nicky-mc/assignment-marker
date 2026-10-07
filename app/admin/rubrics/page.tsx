import Link from "next/link";
import { requireAdmin } from "@/lib/auth/adminAccess";
import { listAllRows, listCourseRows } from "@/lib/rubricAdmin/store";
import { CARD, fmtDate, LINK_BUTTON, Notice } from "@/components/admin/ui";

export default async function RubricsAdminPage({ searchParams }: { searchParams: Promise<{ msg?: string; error?: string }> }) {
  await requireAdmin();
  const { msg, error } = await searchParams;

  let data: Awaited<ReturnType<typeof listAllRows>> | null = null;
  let courses: Awaited<ReturnType<typeof listCourseRows>> = [];
  let loadError: string | undefined;
  try {
    [data, courses] = await Promise.all([listAllRows(), listCourseRows()]);
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Could not load rubrics.";
  }

  const groups = new Map<string, { name: string; rows: NonNullable<typeof data>["rows"] }>();
  for (const c of courses) groups.set(c.id, { name: c.name, rows: [] });
  for (const r of data?.rows ?? []) {
    if (!groups.has(r.course_id)) groups.set(r.course_id, { name: r.course_name, rows: [] });
    groups.get(r.course_id)!.rows.push(r);
  }

  return (
    <>
      <h1 className="font-heading text-3xl font-semibold">Rubrics</h1>
      <Notice msg={msg} error={error ?? loadError} />
      <div className="flex flex-wrap gap-3">
        <Link href="/admin/rubrics/courses/new" className={LINK_BUTTON}>
          New course
        </Link>
        <Link href="/admin/rubrics/new" className={LINK_BUTTON}>
          New rubric
        </Link>
        <Link href="/admin/rubrics/import" className={LINK_BUTTON}>
          Import JSON
        </Link>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- a file download, not a page */}
        <a href="/admin/rubrics/export?all=1" className={LINK_BUTTON}>
          Export all (JSON)
        </a>
      </div>
      <p className="text-base max-w-[70ch]">
        Only approved rubrics are used for marking. A course appears in the Course dropdown once its first rubric is approved.
      </p>

      {Array.from(groups.entries()).map(([courseId, g]) => (
        <section key={courseId} aria-labelledby={`course-${courseId}`} className={CARD}>
          <h2 id={`course-${courseId}`} className="font-heading text-xl font-semibold">
            {g.name} <span className="text-sm font-normal">({courseId})</span>
          </h2>
          {g.rows.length === 0 ? (
            <p className="text-base">No rubrics yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-base">
                <caption className="sr-only">Rubrics in {g.name}</caption>
                <thead>
                  <tr className="border-b-2 border-surface-border">
                    <th scope="col" className="py-2 pr-3">Id</th>
                    <th scope="col" className="py-2 pr-3">Week</th>
                    <th scope="col" className="py-2 pr-3">Title</th>
                    <th scope="col" className="py-2 pr-3">Version</th>
                    <th scope="col" className="py-2 pr-3">Status</th>
                    <th scope="col" className="py-2">Last changed by</th>
                  </tr>
                </thead>
                <tbody>
                  {g.rows.map((r) => {
                    const last = data?.lastChange.get(`${r.id}@${r.version}`);
                    return (
                      <tr key={`${r.id}@${r.version}`} className="border-b border-surface-border/40 align-top">
                        <td className="py-2 pr-3">
                          <Link href={`/admin/rubrics/${encodeURIComponent(r.id)}`} className="underline font-medium break-all">
                            {r.id}
                          </Link>
                        </td>
                        <td className="py-2 pr-3">{r.week}</td>
                        <td className="py-2 pr-3">{r.title}</td>
                        <td className="py-2 pr-3">v{r.version}</td>
                        <td className="py-2 pr-3 font-medium">{r.status}</td>
                        <td className="py-2 break-words">
                          {last ? `${last.by ?? "unknown"}, ${fmtDate(last.at)}` : r.created_by ?? ""}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ))}
    </>
  );
}
