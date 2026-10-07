"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "../auth/adminAccess";
import { createSupabaseServerClient } from "../auth/supabaseServer";
import { friendlyDbError } from "../userAdmin/store";

export interface DeleteResult {
  ok: boolean;
  message: string;
}

// Deleting goes through database functions that check the admin role, refuse a live rubric or a course that still
// has rubrics, and keep a full copy in the audit log first. Direct deletes stay blocked.
export async function deleteRubricAction(id: string): Promise<DeleteResult> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("delete_rubric", { p_id: id });
  if (error) return { ok: false, message: friendlyDbError(error.message) };
  redirect(`/rubrics?msg=${encodeURIComponent("Rubric deleted. A copy is kept in the audit log.")}`);
}

export async function deleteCourseAction(id: string): Promise<DeleteResult> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("delete_course", { p_id: id });
  if (error) return { ok: false, message: friendlyDbError(error.message) };
  redirect(`/rubrics?msg=${encodeURIComponent("Course deleted. A copy is kept in the audit log.")}`);
}
