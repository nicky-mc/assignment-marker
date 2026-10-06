import { redirect } from "next/navigation";
import SignOutButton from "@/components/SignOutButton";
import { getAccess } from "@/lib/auth/access";

export default async function NoAccessPage() {
  const access = await getAccess();
  if (access.status === "unauthenticated") redirect("/login");
  if (access.status === "ok") redirect("/");
  return (
    <div className="flex flex-col flex-1 items-center">
      <main className="flex w-full max-w-3xl flex-col gap-6 pt-6 pb-16 px-6">
        <div className="flex flex-col gap-4 rounded-lg p-6 bg-brand-secondary text-brand-primary border-4 border-brand-primary">
          <h1 className="text-2xl font-semibold">Ask an admin for access</h1>
          <p className="text-sm">
            {access.status === "not_allowed"
              ? `You are signed in as ${access.email}, but this account has not been given access yet.`
              : "We could not check your access just now. Please try again shortly."}
          </p>
          <SignOutButton />
        </div>
      </main>
    </div>
  );
}
