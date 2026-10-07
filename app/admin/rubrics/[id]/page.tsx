import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/adminAccess";

// The existing server actions redirect here with a message. The rubric now lives in the library, so pass it on.
export default async function Moved({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ msg?: string; error?: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const { msg, error } = await searchParams;
  const q = new URLSearchParams();
  if (msg) q.set("msg", msg);
  if (error) q.set("error", error);
  redirect(`/rubrics/${id}${q.size ? `?${q}` : ""}`);
}
