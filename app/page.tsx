import type { Metadata } from "next";
import Image from "next/image";
import Alert from "@/components/Alert";
import PageShell from "@/components/PageShell";
import { HeroCard } from "@/components/HeroCard";
import MarkingForm from "@/components/MarkingForm";
import { requirePageAccess } from "@/lib/auth/pageAccess";
import { listCourses, listRubrics } from "@/lib/rubricStore";
import type { Rubric } from "@/lib/rubrics";

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


// Short ideas for labelling a file or link: the checklist lines for a complete / not complete assignment, otherwise the
// first few requirements. Rubric text is readable by every signed-in user in the library, so this adds no new exposure.
function labelSuggestions(r: Rubric): string[] {
  const source = r.gradingMode === "complete" ? (r.checklist ?? []) : r.requirements.split(/[;.]\s+/);
  return source
    .map((s) => s.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .slice(0, 8)
    .map((s) => (s.length > 50 ? `${s.slice(0, 47).trimEnd()}...` : s));
}

async function loadData() {
  const [courses, rubrics] = await Promise.all([listCourses(), listRubrics()]);
  if (courses.length === 0 || rubrics.length === 0) throw new Error("No approved rubrics found");
  return {
    courses,
    rubrics: rubrics.map((r) => ({ id: r.id, courseId: r.courseId, week: r.week, title: r.title, overview: r.overview, labelSuggestions: labelSuggestions(r) })),
  };
}
