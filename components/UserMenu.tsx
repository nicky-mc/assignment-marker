import { authMode } from "@/lib/auth/config";
import { getSessionEmail } from "@/lib/auth/access";
import SignOutButton from "./SignOutButton";

// A small header menu showing the signed-in email. Renders nothing when sign-in is off or nobody is signed in.
export default async function UserMenu() {
  if (authMode() !== "on") return null;
  let email: string | null = null;
  try {
    email = await getSessionEmail();
  } catch {
    return null;
  }
  if (!email) return null;
  return (
    <details className="relative text-sm">
      <summary className="cursor-pointer list-none rounded-md border border-brand-primary/40 px-3 py-1 max-w-48 truncate">
        {email}
      </summary>
      <div className="absolute right-0 mt-1 z-10 rounded-md border border-brand-primary/40 bg-brand-secondary text-brand-primary p-2">
        <SignOutButton />
      </div>
    </details>
  );
}
