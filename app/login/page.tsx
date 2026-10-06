import { redirect } from "next/navigation";
import SignInButton from "@/components/SignInButton";
import { authMode } from "@/lib/auth/config";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (authMode() !== "on") redirect("/");
  const { error } = await searchParams;
  return (
    <div className="flex flex-col flex-1 items-center">
      <main className="flex w-full max-w-3xl flex-col gap-6 pt-6 pb-16 px-6">
        <div className="flex flex-col gap-4 rounded-lg p-6 bg-brand-secondary text-brand-primary border-4 border-brand-primary">
          <h1 className="text-2xl font-semibold">Sign in to AssisTED</h1>
          <p className="text-sm">Use your Tech Educators Google account.</p>
          {error && (
            <p className="text-sm text-red-700" role="alert">
              Sign-in did not complete. Please try again.
            </p>
          )}
          <SignInButton />
        </div>
      </main>
    </div>
  );
}
