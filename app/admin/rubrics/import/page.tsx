import { requireAdmin } from "@/lib/auth/adminAccess";
import ImportForm from "@/components/admin/ImportForm";
import { CARD, LINK_BUTTON } from "@/components/admin/ui";

export default async function ImportPage() {
  await requireAdmin();
  return (
    <>
      <h1 className="font-heading text-3xl font-semibold">Import JSON</h1>
      <p className="text-base max-w-[70ch]">
        Imported rubrics always land as drafts, never approved. If an id already exists, a new draft version of that
        rubric is created. Each rubric needs: id, courseId, courseName, week, title, overview, requirements and
        stretchGoal. organisation and bandDescriptions (five texts, for bands 0 to 4) are optional.
      </p>
      <div>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- a file download, not a page */}
        <a href="/admin/rubrics/export?template=1" className={LINK_BUTTON}>
          Download blank template
        </a>
      </div>
      <div className={CARD}>
        <ImportForm />
      </div>
    </>
  );
}
