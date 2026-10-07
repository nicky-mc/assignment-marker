import Link from "next/link";
import { notFound } from "next/navigation";
import { AppCard } from "@/components/AppCard";
import { HeroCard } from "@/components/HeroCard";
import { StatusBadge } from "@/components/StatusBadge";
import { SummaryCard } from "@/components/SummaryCard";
import { authMode, rubricSource } from "@/lib/auth/config";
import { FILE_SOURCE_NOTE } from "@/lib/rubricNotes";
import { requirePageAccess } from "@/lib/auth/pageAccess";
import { getLibraryDetail, type LibraryDetail } from "@/lib/rubricStore";

const BODY = "max-w-[70ch] whitespace-pre-line break-words text-base";
const stripBandNumber = (s: string) => s.replace(/^[0-4]\s*-\s*/, "");

export default async function RubricDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const access = await requirePageAccess();
  const admin = authMode() === "on" && access.role === "admin";
  const { id: rawId } = await params;
  const id = decodeURIComponent(rawId);

  let rubric: LibraryDetail | undefined;
  try {
    rubric = await getLibraryDetail(id, admin ? "admin" : "marker");
  } catch (err) {
    console.error(`[rubric detail] ${err instanceof Error ? err.name : "unknown error"}`);
    return (
      <div className="flex flex-col flex-1 items-center">
        <main className="flex w-full max-w-3xl flex-col gap-4 px-6 pt-6 pb-16">
          <AppCard title="Could not load this rubric">
            <p role="alert">Nothing has been changed. Please try again shortly, or ask an admin.</p>
          </AppCard>
        </main>
      </div>
    );
  }
  // A marker asking for a draft-only or retired id gets not-found: they never see those rubrics.
  if (!rubric) notFound();

  const bands = rubric.bandDescriptions ?? rubric.genericBands;
  const usesGenericBands = !rubric.bandDescriptions;

  return (
    <div className="flex flex-col flex-1 items-center">
      <main className="flex w-full max-w-5xl flex-col gap-4 px-6 pt-6 pb-16">
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            <li>
              <Link href="/rubrics" className="underline">
                Rubric library
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href={`/rubrics#course-${rubric.courseId}`} className="underline">
                {rubric.courseName}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="font-medium no-underline">
              {rubric.week}
            </li>
          </ol>
        </nav>

        <HeroCard
          eyebrow={rubric.week}
          aside={<StatusBadge status={rubric.status} version={rubric.version} admin={admin} onPurple />}
          title={rubric.title}
          note={admin && rubricSource() === "file" ? FILE_SOURCE_NOTE : undefined}
        />

        {!admin && <p className="text-sm text-ink-2">Read-only. You can view this rubric but not change it.</p>}

        <div className="grid gap-4 min-[900px]:grid-cols-[minmax(0,1fr)_260px] min-[900px]:gap-x-6">
          <aside aria-label="Details" className="min-[900px]:sticky min-[900px]:top-6 min-[900px]:col-start-2 min-[900px]:row-start-1 min-[900px]:self-start">
            <SummaryCard heading="Details" showHeading>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm min-[900px]:grid-cols-1">
                <div>
                  <dt className="font-semibold">Course</dt>
                  <dd>{rubric.courseName}</dd>
                </div>
                <div>
                  <dt className="font-semibold">Live version</dt>
                  <dd>{rubric.status === "approved" ? (admin ? `Version ${rubric.version}` : "Live") : "Not live"}</dd>
                </div>
                {admin && (
                  <>
                    <div>
                      <dt className="font-semibold">Id</dt>
                      <dd className="break-all">{rubric.id}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold">Organisation</dt>
                      <dd>{rubric.organisation}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold">Status</dt>
                      <dd>{rubric.status === "approved" ? "Live" : rubric.status === "draft" ? "Draft" : "Retired"}</dd>
                    </div>
                  </>
                )}
              </dl>
            </SummaryCard>
          </aside>

          <div className="flex min-w-0 flex-col gap-4 min-[900px]:col-start-1 min-[900px]:row-start-1">
            <AppCard title="What the learner does">
              <p className={BODY}>{rubric.overview}</p>
            </AppCard>
            <AppCard title="What earns a 3">
              <p className={BODY}>{rubric.requirements}</p>
            </AppCard>
            <AppCard title="What earns a 4">
              <p className={BODY}>{rubric.stretchGoal}</p>
            </AppCard>
            <AppCard
              title="Band descriptions"
              helper={usesGenericBands ? "This assignment uses the generic policy bands." : undefined}
            >
              <ol className="flex flex-col gap-3">
                {bands.map((b, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-primary text-sm font-semibold text-brand-secondary dark:bg-brand-secondary dark:text-brand-primary">
                      <span className="sr-only">Band </span>
                      {i}
                    </span>
                    <p className={`${BODY} min-w-0 flex-1 pt-0.5`}>{stripBandNumber(b)}</p>
                  </li>
                ))}
              </ol>
            </AppCard>
            {/* Prompt 3: the history timeline and the editing controls for admins go here. Nothing is rendered yet. */}
          </div>
        </div>
      </main>
    </div>
  );
}
