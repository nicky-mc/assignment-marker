import { HeroCard } from "@/components/HeroCard";
import { AppCard } from "@/components/AppCard";
import RubricLibrary from "@/components/RubricLibrary";
import { authMode, rubricSource } from "@/lib/auth/config";
import { requirePageAccess } from "@/lib/auth/pageAccess";
import { FILE_SOURCE_NOTE } from "@/lib/rubricNotes";
import { listLibrary, type LibraryItem } from "@/lib/rubricStore";

export default async function RubricLibraryPage() {
  const access = await requirePageAccess();
  // Decided on the server from the allowlist role. With sign-in off there are no roles, so everyone is a marker.
  const admin = authMode() === "on" && access.role === "admin";

  let items: LibraryItem[] = [];
  let failed = false;
  try {
    items = await listLibrary(admin ? "admin" : "marker");
  } catch (err) {
    console.error(`[rubric library] ${err instanceof Error ? err.name : "unknown error"}`);
    failed = true;
  }

  return (
    <div className="flex flex-col flex-1 items-center">
      <main className="flex w-full max-w-3xl flex-col gap-4 px-6 pt-6 pb-16">
        <HeroCard title="Rubric library" note={admin && rubricSource() === "file" ? FILE_SOURCE_NOTE : undefined}>
          Browse the rubrics used for marking, by course.
        </HeroCard>
        {failed ? (
          <AppCard title="Could not load the rubrics">
            <p role="alert">Nothing has been changed. Please try again shortly, or ask an admin.</p>
          </AppCard>
        ) : (
          <RubricLibrary items={items} admin={admin} />
        )}
      </main>
    </div>
  );
}
