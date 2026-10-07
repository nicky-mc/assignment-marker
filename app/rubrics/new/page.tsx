import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import { notFound, redirect } from "next/navigation";
import RubricEditor from "@/components/admin/RubricEditor";
import { SummaryCard } from "@/components/SummaryCard";
import { requireAdmin } from "@/lib/auth/adminAccess";
import { rubricSource } from "@/lib/auth/config";
import { listCourseRows } from "@/lib/rubricAdmin/store";
import { stripBandPrefix } from "@/lib/rubricAdmin/validate";
import { BAND_DESCRIPTIONS } from "@/lib/rubrics";

export const metadata: Metadata = { title: "Add assignment" };

// Add assignment: the same layout as a rubric page, in edit mode with empty blocks. Admins only, database rubrics only.
export default async function NewRubricPage({ searchParams }: { searchParams: Promise<{ course?: string }> }) {
  await requireAdmin();
  if (rubricSource() !== "supabase") redirect("/rubrics");
  const { course } = await searchParams;
  if (!course) redirect("/rubrics");

  const courses = await listCourseRows().catch(() => null);
  if (!courses) redirect("/rubrics?error=" + encodeURIComponent("Could not load courses. Please try again."));
  const found = courses.find((c) => c.id === course);
  if (!found) notFound();

  return (
    <PageShell width="wide">
        <RubricEditor
          mode="create"
          rubricId=""
          courseId={found.id}
          courseName={found.name}
          baseline={{ week: "", title: "", overview: "", requirements: "", stretchGoal: "", bands: ["", "", "", "", ""] }}
          liveVersion={null}
          draftVersion={null}
          shownStatus="draft"
          shownVersion={1}
          admin
          canEdit
          genericBands={BAND_DESCRIPTIONS.map(stripBandPrefix)}
          detailsSlot={
            <SummaryCard heading="Details" showHeading>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm min-[900px]:grid-cols-1">
                <div>
                  <dt className="font-semibold">Course</dt>
                  <dd>{found.name}</dd>
                </div>
                <div>
                  <dt className="font-semibold">Status</dt>
                  <dd>New draft</dd>
                </div>
              </dl>
            </SummaryCard>
          }
        />
    </PageShell>
  );
}
