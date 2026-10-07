import type { Metadata } from "next";
import Breadcrumbs from "@/components/Breadcrumbs";
import { AppCard } from "@/components/AppCard";
import { HeroCard } from "@/components/HeroCard";
import UserHistoryTimeline from "@/components/admin/UserHistoryTimeline";
import UsersPanel from "@/components/admin/UsersPanel";
import { requireAdmin } from "@/lib/auth/adminAccess";
import { listAccessHistory, listPeople, type AccessHistoryRow, type PersonRow } from "@/lib/userAdmin/store";

export const metadata: Metadata = { title: "Users" };

export default async function UsersPage() {
  const admin = await requireAdmin();
  const domain = process.env.ALLOWED_EMAIL_DOMAIN?.trim().replace(/^@/, "") || null;

  let people: PersonRow[] = [];
  let history: AccessHistoryRow[] = [];
  let failed = false;
  try {
    [people, history] = await Promise.all([listPeople(), listAccessHistory()]);
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
          <UsersPanel people={people} me={admin.email} allowedDomain={domain} />
          <UserHistoryTimeline history={history} />
        </>
      )}
    </>
  );
}
