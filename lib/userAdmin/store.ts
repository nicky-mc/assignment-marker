// Reads and changes for the user management screen. Server only. Acts as the signed-in admin: reads go through
// row-level security, and every change goes through a database function that re-checks the admin role.
import { createSupabaseServerClient } from "../auth/supabaseServer";

export interface PersonRow {
  email: string;
  role: "admin" | "marker";
  added_by: string | null;
  created_at: string;
  /** Joined within the last 7 days. Worked out here so the page does not read the clock while rendering. */
  is_new: boolean;
}

export interface SignupSettings {
  enabled: boolean;
  allowed_domains: string[];
}

export interface BlockedRow {
  email: string;
  blocked_by: string | null;
  blocked_at: string;
}

export interface AccessHistoryRow {
  id: number;
  email: string;
  action: "added" | "role_changed" | "removed" | "settings_changed" | "unblocked";
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
  invalid_domain: "Enter a domain like techeducators.co.uk (no @ and no spaces).",
  freemail_domain: "That is a free email service, so anyone could sign up with it. Use your organisation's own domain.",
  too_many_domains: "You can allow at most 5 domains.",
  no_domains: "Add at least one domain before turning this on.",
  invalid_setting: "Something went wrong. Nothing was changed.",
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
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return ((data ?? []) as Omit<PersonRow, "is_new">[]).map((p) => ({ ...p, is_new: new Date(p.created_at).getTime() > weekAgo }));
}

export async function getSignupSettings(): Promise<SignupSettings> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("signup_settings").select("enabled, allowed_domains").maybeSingle();
  if (error || !data) throw new UserAdminError("Could not read the sign-up settings.");
  return data as SignupSettings;
}

export async function listBlocked(): Promise<BlockedRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("access_blocklist").select("email, blocked_by, blocked_at").order("blocked_at", { ascending: false });
  if (error) throw new UserAdminError("Could not read the list of removed people.");
  return (data ?? []) as BlockedRow[];
}

export async function listAccessHistory(): Promise<AccessHistoryRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("user_access_history").select("*").order("changed_at", { ascending: false }).limit(100);
  if (error) throw new UserAdminError("Could not read the history.");
  return (data ?? []) as AccessHistoryRow[];
}

export async function callUserFunction(name: "add_allowed_user" | "set_user_role" | "remove_allowed_user" | "unblock_email" | "set_signup_settings", args: Record<string, unknown>): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc(name, args);
  if (error) throw new UserAdminError(friendlyDbError(error.message));
}
