import { requireAdmin } from "@/lib/auth/adminAccess";
import RubricForm, { EMPTY_FORM } from "@/components/admin/RubricForm";
import { CARD, Notice } from "@/components/admin/ui";
import { listCourseRows } from "@/lib/rubricAdmin/store";
import { BAND_DESCRIPTIONS } from "@/lib/rubrics";
import { stripBandPrefix } from "@/lib/rubricAdmin/validate";

export default async function NewRubricPage() {
  await requireAdmin();
  let courses: Awaited<ReturnType<typeof listCourseRows>> = [];
  let error: string | undefined;
  try {
    courses = await listCourseRows();
  } catch (err) {
    error = err instanceof Error ? err.message : "Could not load courses.";
  }
  return (
    <>
      <h1 className="font-heading text-3xl font-semibold">New rubric</h1>
      <Notice error={error} />
      <div className={CARD}>
        <RubricForm
          mode="create"
          courses={courses}
          initial={EMPTY_FORM}
          genericBands={BAND_DESCRIPTIONS.map(stripBandPrefix)}
          heading="Rubric details"
          note="A new rubric is saved as a draft and is not used for marking until it is approved."
        />
      </div>
    </>
  );
}
