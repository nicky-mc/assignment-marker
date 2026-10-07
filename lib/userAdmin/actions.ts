"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "../auth/adminAccess";
import { validateDomains } from "../signupRules";
import { callUserFunction, UserAdminError } from "./store";

export interface UserActionResult {
  ok: boolean;
  message: string;
}

async function run(fn: () => Promise<void>, success: string): Promise<UserActionResult> {
  try {
    await fn();
  } catch (err) {
    return { ok: false, message: err instanceof UserAdminError ? err.message : "Something went wrong. Nothing was changed." };
  }
  revalidatePath("/admin/users");
  return { ok: true, message: success };
}

const clean = (v: unknown) => (typeof v === "string" ? v.trim().toLowerCase() : "");

export async function addPersonAction(email: string, role: string): Promise<UserActionResult> {
  await requireAdmin(); // checked again inside the database function
  return run(() => callUserFunction("add_allowed_user", { p_email: clean(email), p_role: role }), `${clean(email)} can now sign in as a ${role}.`);
}

export async function setRoleAction(email: string, role: string): Promise<UserActionResult> {
  await requireAdmin();
  return run(() => callUserFunction("set_user_role", { p_email: clean(email), p_role: role }), `${clean(email)} is now a ${role}.`);
}

export async function removePersonAction(email: string): Promise<UserActionResult> {
  await requireAdmin();
  return run(() => callUserFunction("remove_allowed_user", { p_email: clean(email) }), `${clean(email)} no longer has access.`);
}

export async function unblockEmailAction(email: string): Promise<UserActionResult> {
  await requireAdmin();
  return run(() => callUserFunction("unblock_email", { p_email: clean(email) }), `${clean(email)} can now be added automatically again when they sign in.`);
}

export async function setSignupSettingsAction(enabled: boolean, domains: string[]): Promise<UserActionResult> {
  await requireAdmin(); // checked again inside the database function
  const check = validateDomains(Array.isArray(domains) ? domains.filter((d) => typeof d === "string") : [], Boolean(enabled));
  if (!check.ok) return { ok: false, message: check.message };
  return run(
    () => callUserFunction("set_signup_settings", { p_enabled: Boolean(enabled), p_domains: check.domains }),
    enabled ? "Staff sign-up is on." : "Staff sign-up is off.",
  );
}
