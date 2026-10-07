import type { Metadata } from "next";
import { connection } from "next/server";
import Alert from "@/components/Alert";
import PageShell from "@/components/PageShell";

export const metadata: Metadata = { title: "Service not available" };

export default async function ConfigErrorPage() {
  await connection(); // per request: the header reads who is signed in, so this page is never prerendered
  return (
    <PageShell className="justify-center">
      <div className="flex flex-col gap-3 rounded-[14px] border-2 border-surface-border bg-surface p-5 text-ink">
        <h1 className="font-heading text-2xl font-semibold">This service is not available</h1>
        <Alert variant="error" title="Marking is switched off">
          This deployment has not been set up safely, so marking is switched off. Nothing has been sent anywhere. Please contact an administrator.
        </Alert>
      </div>
    </PageShell>
  );
}
