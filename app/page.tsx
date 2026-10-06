import Image from "next/image";
import MarkingForm from "@/components/MarkingForm";
import { requirePageAccess } from "@/lib/auth/pageAccess";
import { listCourses, listRubrics } from "@/lib/rubricStore";

export default async function Home() {
  await requirePageAccess();

  // Only what the dropdowns need goes to the browser: no requirements or band text.
  let data: Awaited<ReturnType<typeof loadData>> | null = null;
  try {
    data = await loadData();
  } catch (err) {
    console.error(`[rubrics] ${err instanceof Error ? err.name : "unknown error"}`);
  }

  return (
    <div className="flex flex-col flex-1 items-center">
      <main className="flex flex-1 w-full max-w-3xl flex-col gap-6 pt-6 pb-16 px-6">
        <div className="rounded-lg p-6 bg-brand-primary text-brand-secondary">
          <div className="flex items-center gap-3">
            <Image src="/te-monogram.png" alt="" width={30} height={46} className="h-9 w-auto" />
            <h1 className="text-3xl font-semibold">AssisTED</h1>
          </div>
          <p className="text-brand-secondary/85">
            Assistant to help grade learner submissions against Tech Educators Rubrics
          </p>
        </div>
        {data ? (
          <MarkingForm courses={data.courses} rubrics={data.rubrics} />
        ) : (
          <p className="rounded-md border-4 border-brand-primary bg-brand-secondary text-brand-primary p-4 text-sm" role="alert">
            Could not load the rubrics, so marking is unavailable. Nothing has been sent anywhere. Please try
            again shortly, or ask an admin.
          </p>
        )}
      </main>
    </div>
  );
}


async function loadData() {
  const [courses, rubrics] = await Promise.all([listCourses(), listRubrics()]);
  if (courses.length === 0 || rubrics.length === 0) throw new Error("No approved rubrics found");
  return {
    courses,
    rubrics: rubrics.map(({ id, courseId, week, title, overview }) => ({ id, courseId, week, title, overview })),
  };
}
