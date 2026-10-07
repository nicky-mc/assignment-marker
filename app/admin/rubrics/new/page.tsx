import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/adminAccess";

// Creating now happens in the rubric library ("Add assignment" and "New course"), not on a separate page.
export default async function Moved() {
  await requireAdmin();
  redirect("/rubrics");
}
