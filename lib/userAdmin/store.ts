// Reads and changes for the user management screen. Server only. Acts as the signed-in admin: reads go through
// row-level security, and every change goes through a database function that re-checks the admin role.
import { createSupabaseServerClient } from "../auth/supabaseServer";

export interface PersonRow {
  email: string;
  role: "admin" | "marker";
  added_by: string | null;
  created_at: string;
}

export interface AccessHistoryRow {
  id: number;
  email: string;
  action: "added" | "role_changed" | "removed";
  old_role: string | null;
  new_role: string | null;
  changed_by: string | null;
  changed_at: string;
}

export class UserAdminError extends Error {}

/** Plain-language messages for the codes the database functions raise. */
const MESSAGES: Record<string, string> = {
  admin_required: "Only admins can do this.",
  invalid_role: "Choose Admin or Marker.",
  invalid_email: "That does not look like a valid email address.",
  already_allowed: "That person already has access.",
  not_found: "That person was not found.",
  no_change: "They already have that role.",
  last_admin: "There must always be at least one admin. Make someone else an admin first.",
  own_access: "You cannot remove your own access. Ask another admin to do it.",
  live_version: "Retire it first. Deleting a live rubric would remove it from marking straight away.",
  course_not_empty: "This course still has rubrics. Delete its rubrics first.",
};

export function friendlyDbError(message: string | undefined): string {
  const code = Object.keys(MESSAGES).find((c) => message?.includes(c));
  return code ? MESSAGES[code] : "Something went wrong. Nothing was changed. Please try again.";
}

export async function listPeople(): Promise<PersonRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("allowed_users").select("email, role, added_by, created_at").order("email");
  if (error) throw new UserAdminError("Could not read the list of people.");
  return (data ?? []) as PersonRow[];
}

export async function listAccessHistory(): Promise<AccessHistoryRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("user_access_history").select("*").order("changed_at", { ascending: false }).limit(100);
  if (error) throw new UserAdminError("Could not read the history.");
  return (data ?? []) as AccessHistoryRow[];
}

export async function callUserFunction(name: "add_allowed_user" | "set_user_role" | "remove_allowed_user", args: Record<string, string>): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc(name, args);
  if (error) throw new UserAdminError(friendlyDbError(error.message));
}
