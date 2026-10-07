import type { Metadata } from "next";
import Breadcrumbs from "@/components/Breadcrumbs";
import { AppCard } from "@/components/AppCard";
import { HeroCard } from "@/components/HeroCard";
import UserHistoryTimeline from "@/components/admin/UserHistoryTimeline";
import SignupSettingsCard from "@/components/admin/SignupSettingsCard";
import UsersPanel from "@/components/admin/UsersPanel";
import { requireAdmin } from "@/lib/auth/adminAccess";
import { getSignupSettings, listAccessHistory, listBlocked, listPeople, type AccessHistoryRow, type BlockedRow, type PersonRow, type SignupSettings } from "@/lib/userAdmin/store";

export const metadata: Metadata = { title: "Users" };

export default async function UsersPage() {
  const admin = await requireAdmin();
  const domain = process.env.ALLOWED_EMAIL_DOMAIN?.trim().replace(/^@/, "") || null;

  let people: PersonRow[] = [];
  let history: AccessHistoryRow[] = [];
  let removed: BlockedRow[] = [];
  let signup: SignupSettings | null = null;
  let failed = false;
  try {
    [people, history] = await Promise.all([listPeople(), listAccessHistory()]);
    // Added by migration 004. If it has not been run yet the rest of the page still works.
    [signup, removed] = await Promise.all([getSignupSettings().catch(() => null), listBlocked().catch(() => [])]);
  } catch (err) {
    console.error(`[users] ${err instanceof Error ? err.name : "unknown error"}`);
    failed = true;
  }

  return (
    <>
      <Breadcrumbs items={[{ label: "Marking", href: "/" }, { label: "Users" }]} />
      <HeroCard title="Users">Add people, change their role, or remove their access.</HeroCard>
      {failed ? (
        <AppCard title="Could not load users">
          <p role="alert">
            Nothing has been changed. If this is the first time, check that the latest migration has been run, then try again.
          </p>
        </AppCard>
      ) : (
        <>
          {signup ? (
            <SignupSettingsCard enabled={signup.enabled} domains={signup.allowed_domains} />
          ) : (
            <AppCard title="Staff sign-up">
              <p role="alert">Staff sign-up settings are not available yet. Ask whoever looks after the database to run the latest migration.</p>
            </AppCard>
          )}
          <UsersPanel people={people} removed={removed} me={admin.email} allowedDomain={domain} />
          <UserHistoryTimeline history={history} />
        </>
      )}
    </>
  );
}
