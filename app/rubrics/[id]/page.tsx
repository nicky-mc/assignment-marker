import Link from "next/link";
import { notFound } from "next/navigation";
import { AppCard } from "@/components/AppCard";
import { HeroCard } from "@/components/HeroCard";
import { StatusBadge } from "@/components/StatusBadge";
import { SummaryCard } from "@/components/SummaryCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { authMode, rubricSource } from "@/lib/auth/config";
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
      <main className="flex w-full max-w-3xl flex-col gap-4 px-6 pt-6 pb-16">
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
            <li aria-current="page">{rubric.week}</li>
          </ol>
        </nav>

        <HeroCard
          title={
            <>
              <span className="block text-base font-normal text-purple-body">{rubric.week}</span>
              {rubric.title}
            </>
          }
        >
          <StatusBadge status={rubric.status} version={rubric.version} admin={admin} onPurple />
        </HeroCard>

        {!admin && (
          <p className="text-sm text-ink-2">Read-only. You can view this rubric but not change it.</p>
        )}
        {admin && rubricSource() === "file" && (
          <p role="note" className="rounded-[10px] border-2 border-surface-border px-4 py-3 text-sm">
            Editing needs RUBRIC_SOURCE=supabase
          </p>
        )}

        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_14rem]">
          <div className="flex min-w-0 flex-col gap-4">
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
              <Tabs defaultValue="band-0">
                <TabsList aria-label="Band" className="h-auto w-full flex-wrap justify-start gap-2 bg-transparent p-0">
                  {bands.map((_, i) => (
                    <TabsTrigger
                      key={i}
                      value={`band-${i}`}
                      className="h-10 min-w-16 flex-none rounded-[10px] border-2 border-border bg-transparent px-3 text-base text-foreground data-active:border-primary-edge data-active:bg-primary data-active:text-primary-foreground"
                    >
                      Band {i}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {bands.map((b, i) => (
                  <TabsContent key={i} value={`band-${i}`} className="pt-2">
                    <p className={BODY}>{stripBandNumber(b)}</p>
                  </TabsContent>
                ))}
              </Tabs>
            </AppCard>
            {/* Prompt 3: the history timeline and the editing controls for admins go here. Nothing is rendered yet. */}
          </div>

          <aside aria-label="Details" className="md:self-start">
            <SummaryCard heading="Details" showHeading>
              <dl className="flex flex-col gap-2 text-sm">
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
        </div>
      </main>
    </div>
  );
}
