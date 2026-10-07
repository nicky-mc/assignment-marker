import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/adminAccess";

// The rubric list lives in the library at /rubrics. The existing actions redirect here with a message, so pass it on.
// Markers never reach this far: requireAdmin returns the 403 page for them.
export default async function RubricsAdminPage({ searchParams }: { searchParams: Promise<{ msg?: string; error?: string }> }) {
  await requireAdmin();
  const { msg, error } = await searchParams;
  const q = new URLSearchParams();
  if (msg) q.set("msg", msg);
  if (error) q.set("error", error);
  redirect(`/rubrics${q.size ? `?${q}` : ""}`);
}
