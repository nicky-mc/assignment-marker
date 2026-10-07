import type { Metadata } from "next";
import Breadcrumbs from "@/components/Breadcrumbs";
import PageShell from "@/components/PageShell";
import { notFound } from "next/navigation";
import { AppCard } from "@/components/AppCard";
import FlashMessage from "@/components/FlashMessage";
import HistoryTimeline from "@/components/admin/HistoryTimeline";
import RubricEditor, { type EditorValues } from "@/components/admin/RubricEditor";
import { Notice } from "@/components/admin/ui";
import { SummaryCard } from "@/components/SummaryCard";
import { authMode, rubricSource } from "@/lib/auth/config";
import { requirePageAccess } from "@/lib/auth/pageAccess";
import { getDetail } from "@/lib/rubricAdmin/store";
import { stripBandPrefix } from "@/lib/rubricAdmin/validate";
import { FILE_SOURCE_NOTE } from "@/lib/rubricNotes";
import { getLibraryDetail, type LibraryDetail } from "@/lib/rubricStore";

export const metadata: Metadata = { title: "Rubric details" };

type Details = { label: string; value: string; breakAll?: boolean }[];

function DetailsCard({ rows }: { rows: Details }) {
  return (
    <SummaryCard heading="Details" showHeading>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm min-[900px]:grid-cols-1">
        {rows.map((r) => (
          <div key={r.label}>
            <dt className="font-semibold">{r.label}</dt>
            <dd className={r.breakAll ? "break-all" : undefined}>{r.value}</dd>
          </div>
        ))}
      </dl>
    </SummaryCard>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <PageShell width="wide">{children}</PageShell>
  );
}

function Breadcrumb({ courseId, courseName, week }: { courseId: string; courseName: string; week: string }) {
  return (
    <Breadcrumbs
      items={[
        { label: "Rubric library", href: "/rubrics" },
        { label: courseName, href: `/rubrics#course-${courseId}` },
        { label: week },
      ]}
    />
  );
}

export default async function RubricDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ msg?: string; error?: string }>;
}) {
  const access = await requirePageAccess();
  const admin = authMode() === "on" && access.role === "admin";
  const fromDatabase = rubricSource() === "supabase";
  const { id: rawId } = await params;
  const id = decodeURIComponent(rawId);
  const { msg, error } = await searchParams;
  const banners = (
    <>
      <FlashMessage msg={msg} error={error} />
      <Notice msg={msg} error={error} />
    </>
  );

  const failed = (
    <Shell>
      <AppCard title="Could not load this rubric">
        <p role="alert">Nothing has been changed. Please try again shortly, or ask an admin.</p>
      </AppCard>
    </Shell>
  );

  // Admins reading from the database get the working copy (the open draft if there is one) plus history, so editing
  // in place edits exactly what they see. Everyone else gets the read-only library view.
  if (admin && fromDatabase) {
    let detail: Awaited<ReturnType<typeof getDetail>>;
    let generic: string[];
    try {
      detail = await getDetail(id);
      generic = (await getLibraryDetail(id, "admin"))?.genericBands ?? [];
    } catch (err) {
      console.error(`[rubric detail] ${err instanceof Error ? err.name : "unknown error"}`);
      return failed;
    }
    if (detail.versions.length === 0) notFound();
    const live = detail.versions.find((v) => v.status === "approved");
    const draft = detail.versions.find((v) => v.status === "draft");
    const working = draft ?? live ?? detail.versions[0];
    const baseline: EditorValues = {
      week: working.week,
      title: working.title,
      overview: working.overview,
      requirements: working.requirements,
      stretchGoal: working.stretch_goal,
      bands: working.band_descriptions ? working.band_descriptions.map(stripBandPrefix) : ["", "", "", "", ""],
    };
    const rows: Details = [
      { label: "Course", value: working.course_name },
      { label: "Live version", value: live ? `Version ${live.version}` : "Not live" },
      ...(draft ? [{ label: "Draft pending", value: `Version ${draft.version}` }] : []),
      { label: "Id", value: working.id, breakAll: true },
      { label: "Organisation", value: working.organisation },
      { label: "Status", value: working.status === "approved" ? "Live" : working.status === "draft" ? "Draft" : "Retired" },
    ];
    return (
      <Shell>
        <Breadcrumb courseId={working.course_id} courseName={working.course_name} week={working.week} />
        {banners}
        <RubricEditor
          key={`${working.version}-${working.status}-${msg ?? ""}`}
          mode="view"
          rubricId={working.id}
          courseId={working.course_id}
          courseName={working.course_name}
          baseline={baseline}
          liveVersion={live?.version ?? null}
          draftVersion={draft?.version ?? null}
          shownStatus={working.status}
          shownVersion={working.version}
          everLive={detail.versions.some((v) => v.status !== "draft") || detail.history.some((h) => h.action === "approved")}
          admin
          canEdit
          genericBands={generic.map(stripBandPrefix)}
          detailsSlot={<DetailsCard rows={rows} />}
          historySlot={<HistoryTimeline history={detail.history} />}
        />
      </Shell>
    );
  }

  let rubric: LibraryDetail | undefined;
  try {
    rubric = await getLibraryDetail(id, admin ? "admin" : "marker");
  } catch (err) {
    console.error(`[rubric detail] ${err instanceof Error ? err.name : "unknown error"}`);
    return failed;
  }
  // A marker asking for a draft-only or retired id gets not-found: they never see those rubrics.
  if (!rubric) notFound();

  const baseline: EditorValues = {
    week: rubric.week,
    title: rubric.title,
    overview: rubric.overview,
    requirements: rubric.requirements,
    stretchGoal: rubric.stretchGoal,
    bands: rubric.bandDescriptions ? rubric.bandDescriptions.map(stripBandPrefix) : ["", "", "", "", ""],
  };
  const rows: Details = [
    { label: "Course", value: rubric.courseName },
    { label: "Live version", value: rubric.status === "approved" ? (admin ? `Version ${rubric.version}` : "Live") : "Not live" },
    ...(admin
      ? [
          { label: "Id", value: rubric.id, breakAll: true },
          { label: "Organisation", value: rubric.organisation },
          { label: "Status", value: rubric.status === "approved" ? "Live" : rubric.status === "draft" ? "Draft" : "Retired" },
        ]
      : []),
  ];

  return (
    <Shell>
      <Breadcrumb courseId={rubric.courseId} courseName={rubric.courseName} week={rubric.week} />
      {banners}
      <RubricEditor
        mode="view"
        rubricId={rubric.id}
        courseId={rubric.courseId}
        courseName={rubric.courseName}
        baseline={baseline}
        liveVersion={rubric.status === "approved" ? rubric.version : null}
        draftVersion={null}
        shownStatus={rubric.status}
        shownVersion={rubric.version}
        admin={admin}
        canEdit={false}
        heroNote={admin && !fromDatabase ? FILE_SOURCE_NOTE : undefined}
        genericBands={rubric.genericBands.map(stripBandPrefix)}
        detailsSlot={<DetailsCard rows={rows} />}
      />
    </Shell>
  );
}
