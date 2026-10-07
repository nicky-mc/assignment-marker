import type { Metadata } from "next";
import Image from "next/image";
import Alert from "@/components/Alert";
import PageShell from "@/components/PageShell";
import { HeroCard } from "@/components/HeroCard";
import MarkingForm from "@/components/MarkingForm";
import { requirePageAccess } from "@/lib/auth/pageAccess";
import { listCourses, listRubrics } from "@/lib/rubricStore";

export const metadata: Metadata = { title: "Mark a submission" };

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
    <PageShell>
        <HeroCard
          icon={<Image src="/te-monogram.png" alt="" width={30} height={46} className="h-9 w-auto" />}
          title="AssisTED"
        >
          Assistant to help grade learner submissions against Tech Educators Rubrics
        </HeroCard>
        {data ? (
          <MarkingForm courses={data.courses} rubrics={data.rubrics} />
        ) : (
          <Alert variant="error" title="Could not load the rubrics">
            Marking is unavailable. Nothing has been sent anywhere. Please try again shortly, or ask an admin.
          </Alert>
        )}
    </PageShell>
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
