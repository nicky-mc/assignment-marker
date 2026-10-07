import { redirect } from "next/navigation";
import { connection } from "next/server";
import SignInButton from "@/components/SignInButton";
import { authMode } from "@/lib/auth/config";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await connection(); // per request: AUTH_MODE is read at runtime, not baked in at build time
  if (authMode() !== "on") redirect("/");
  const { error } = await searchParams;
  return (
    <div className="flex flex-col flex-1 items-center">
      <main className="flex w-full max-w-3xl flex-col gap-6 pt-6 pb-16 px-6">
        <div className="flex flex-col gap-4 rounded-[14px] border-2 border-surface-border bg-surface p-5 text-ink">
          <h1 className="text-2xl font-semibold">Sign in to AssisTED</h1>
          <p className="text-sm">Use your Tech Educators Google account.</p>
          {error && (
            <p className="text-sm text-danger" role="alert">
              Sign-in did not complete. Please try again.
            </p>
          )}
          <SignInButton />
        </div>
      </main>
    </div>
  );
}
