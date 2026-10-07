import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import Alert from "@/components/Alert";
import Logo from "@/components/Logo";
import NeedAccess from "@/components/NeedAccess";
import PageShell from "@/components/PageShell";
import SignInButton from "@/components/SignInButton";
import { authMode } from "@/lib/auth/config";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await connection(); // per request: AUTH_MODE is read at runtime, not baked in at build time
  if (authMode() !== "on") redirect("/");
  const { error } = await searchParams;
  return (
    <PageShell hideLogo className="items-center justify-center">
      <div className="flex w-full max-w-sm flex-col items-center gap-6">
        <Logo centered className="h-10 w-52" />
        <div className="flex w-full flex-col gap-4 rounded-[14px] border-2 border-surface-border bg-surface p-5 text-ink">
          <h1 className="font-heading text-2xl font-semibold">Sign in to AssisTED</h1>
          <p className="text-sm">Use your Tech Educators Google account.</p>
          {error && (
            <Alert variant="error" title="Sign-in did not complete">
              Please try again.
            </Alert>
          )}
          <SignInButton />
          <NeedAccess />
        </div>
      </div>
    </PageShell>
  );
}
