import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/adminAccess";

// The rubric list now lives in the library at /rubrics, which shows admins every status.
// Markers never reach this far: requireAdmin returns the 403 page for them.
export default async function RubricsAdminPage() {
  await requireAdmin();
  redirect("/rubrics");
}
