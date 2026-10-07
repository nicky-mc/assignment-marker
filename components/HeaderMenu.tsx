import { authMode } from "@/lib/auth/config";
import { getAccess } from "@/lib/auth/access";
import AppMenu, { type MenuLink } from "./AppMenu";

// Server component: decides from the user's role which menu items exist. Renders nothing when the visitor
// is not allowed in (for example on the sign-in page). With AUTH_MODE off there is no email, role or sign out.
export default async function HeaderMenu() {
  let access;
  try {
    access = await getAccess();
  } catch {
    return null;
  }
  if (access.status !== "ok") return null;

  const authOn = authMode() === "on";
  // Only pages that exist. "Manage users" (admins) is added when /admin/users exists.
  const links: MenuLink[] = [
    { href: "/", label: "Mark" },
    { href: "/rubrics", label: "Rubric library" },
  ];

  return <AppMenu email={authOn ? access.email : null} role={authOn ? access.role : null} links={links} canSignOut={authOn} />;
}
