import { forbidden, redirect } from "next/navigation";
import { getAccess } from "./access";

/**
 * Admin-only gate for pages, server actions and route handlers. Checked on the server every time:
 * a verified session AND the 'admin' role in allowed_users. Markers and everyone else get a 403 page.
 */
export async function requireAdmin(): Promise<{ email: string }> {
  const access = await getAccess();
  if (access.status === "unauthenticated") redirect("/login");
  if (access.status === "misconfigured") redirect("/config-error");
  if (access.status === "ok" && access.role === "admin" && access.email) return { email: access.email };
  forbidden();
}
