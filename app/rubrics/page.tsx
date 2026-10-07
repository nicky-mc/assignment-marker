import { HeroCard } from "@/components/HeroCard";
import { AppCard } from "@/components/AppCard";
import FlashMessage from "@/components/FlashMessage";
import LibraryMoreMenu from "@/components/admin/LibraryMoreMenu";
import NewCourseDialog from "@/components/admin/NewCourseDialog";
import { Notice } from "@/components/admin/ui";
import RubricLibrary from "@/components/RubricLibrary";
import { authMode, rubricSource } from "@/lib/auth/config";
import { requirePageAccess } from "@/lib/auth/pageAccess";
import { listDeletions, type DeletionRow } from "@/lib/rubricAdmin/deleteStore";
import { listCourseRows } from "@/lib/rubricAdmin/store";
import { FILE_SOURCE_NOTE } from "@/lib/rubricNotes";
import { listLibrary, type LibraryItem } from "@/lib/rubricStore";

const ON_PURPLE_SECONDARY = "border-brand-secondary bg-transparent text-brand-secondary hover:bg-brand-secondary/15";

export default async function RubricLibraryPage({ searchParams }: { searchParams: Promise<{ msg?: string; error?: string }> }) {
  const access = await requirePageAccess();
  // Decided on the server from the allowlist role. With sign-in off there are no roles, so everyone is a marker.
  const admin = authMode() === "on" && access.role === "admin";
  // Editing controls exist only for admins when rubrics come from the database.
  const canEdit = admin && rubricSource() === "supabase";
  const { msg, error } = await searchParams;

  let items: LibraryItem[] = [];
  let emptyCourses: { id: string; name: string }[] = [];
  let deletions: DeletionRow[] = [];
  let failed = false;
  try {
    items = await listLibrary(admin ? "admin" : "marker");
    if (canEdit) {
      emptyCourses = await listCourseRows();
      deletions = await listDeletions().catch(() => []);
    }
  } catch (err) {
    console.error(`[rubric library] ${err instanceof Error ? err.name : "unknown error"}`);
    failed = true;
  }

  return (
    <div className="flex flex-col flex-1 items-center">
      <main className="flex w-full max-w-3xl flex-col gap-4 px-6 pt-6 pb-16">
        <FlashMessage msg={msg} error={error} />
        <HeroCard
          title="Rubric library"
          note={admin && rubricSource() === "file" ? FILE_SOURCE_NOTE : undefined}
          actions={
            canEdit ? (
              <>
                <NewCourseDialog triggerClassName={ON_PURPLE_SECONDARY} />
                <LibraryMoreMenu triggerClassName={ON_PURPLE_SECONDARY} deletions={deletions} />
              </>
            ) : undefined
          }
        >
          Browse the rubrics used for marking, by course.
        </HeroCard>
        <Notice msg={msg} error={error} />
        {failed ? (
          <AppCard title="Could not load the rubrics">
            <p role="alert">Nothing has been changed. Please try again shortly, or ask an admin.</p>
          </AppCard>
        ) : (
          <RubricLibrary items={items} admin={admin} canEdit={canEdit} emptyCourses={emptyCourses} />
        )}
      </main>
    </div>
  );
}
