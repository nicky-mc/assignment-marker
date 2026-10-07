import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import NeedAccess from "@/components/NeedAccess";
import PageShell from "@/components/PageShell";
import SignOutButton from "@/components/SignOutButton";
import { getAccess } from "@/lib/auth/access";

export const metadata: Metadata = { title: "Access needed" };

export default async function NoAccessPage() {
  await connection(); // per request, never prerendered
  const access = await getAccess();
  if (access.status === "unauthenticated") redirect("/login");
  if (access.status === "ok") redirect("/");
  return (
    <PageShell className="justify-center">
      <div className="flex flex-col gap-4 rounded-[14px] border-2 border-surface-border bg-surface p-5 text-ink">
        <h1 className="font-heading text-2xl font-semibold">Ask an admin for access</h1>
        <p className="text-sm">
          {access.status === "not_allowed"
            ? `You are signed in as ${access.email}, but this account has not been given access yet.`
            : "We could not check your access just now. Please try again shortly."}
        </p>
        <NeedAccess />
        <SignOutButton />
      </div>
    </PageShell>
  );
}
