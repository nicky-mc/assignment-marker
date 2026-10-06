import { authMode, isUnsafeProduction } from "./config";
import { createSupabaseServerClient } from "./supabaseServer";

export type Role = "admin" | "marker";

export type Access =
  | { status: "ok"; email: string | null; role: Role | null } // email and role are null when AUTH_MODE is off
  | { status: "unauthenticated" }
  | { status: "not_allowed"; email: string }
  | { status: "misconfigured" }
  | { status: "error" };

/** The signed-in user's email from a verified token, or null. Never trusts the cookie unverified. */
export async function getSessionEmail(): Promise<string | null> {
  if (authMode() !== "on") return null;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getClaims();
  const email = data?.claims?.email;
  return typeof email === "string" && email ? email.toLowerCase() : null;
}

/**
 * The one access check, run on the server for every page and every /api/mark request, before any
 * call to the AI. Needs a verified session AND a row in allowed_users (read with the user's own
 * session under Row Level Security).
 */
export async function getAccess(): Promise<Access> {
  if (isUnsafeProduction()) return { status: "misconfigured" };
  if (authMode() !== "on") return { status: "ok", email: null, role: null };

  try {
    const email = await getSessionEmail();
    if (!email) return { status: "unauthenticated" };
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("allowed_users").select("role").eq("email", email).maybeSingle();
    if (error) return { status: "error" };
    if (!data) return { status: "not_allowed", email };
    return { status: "ok", email, role: data.role as Role };
  } catch {
    return { status: "error" };
  }
}
