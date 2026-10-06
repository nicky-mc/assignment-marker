import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getAccess, type Access } from "./access";

/** For server components: redirect anyone who should not see the page, otherwise return their access. */
export async function requirePageAccess(): Promise<Extract<Access, { status: "ok" }>> {
  // Run per request. Without this, a page whose checks read only env switches is prerendered at build
  // time, which bakes the build-time AUTH_MODE into the page.
  await connection();
  const access = await getAccess();
  if (access.status === "ok") return access;
  if (access.status === "unauthenticated") redirect("/login");
  if (access.status === "not_allowed") redirect("/no-access");
  redirect("/config-error");
}
