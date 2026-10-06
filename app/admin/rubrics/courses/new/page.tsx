import { requireAdmin } from "@/lib/auth/adminAccess";
import CourseForm from "@/components/admin/CourseForm";
import { CARD } from "@/components/admin/ui";

export default async function NewCoursePage() {
  await requireAdmin();
  return (
    <>
      <h1 className="font-heading text-3xl font-semibold">New course</h1>
      <p className="text-base max-w-[70ch]">
        A course appears in the Course dropdown once its first rubric is approved.
      </p>
      <div className={CARD}>
        <CourseForm />
      </div>
    </>
  );
}
