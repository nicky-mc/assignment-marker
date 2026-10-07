import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";

export const metadata: Metadata = { title: "Admins only" };

export default function Forbidden() {
  return (
    <PageShell className="justify-center">
      <div className="flex flex-col gap-3 rounded-[14px] border-2 border-surface-border bg-surface p-5 text-ink">
        <h1 className="font-heading text-2xl font-semibold">403: Admins only</h1>
        <p className="text-base">This page is only for admins. If you need access, please ask an admin.</p>
        <Link href="/" className="inline-flex min-h-6 w-fit items-center font-medium underline">
          Back to marking
        </Link>
      </div>
    </PageShell>
  );
}
