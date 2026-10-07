import { cache } from "react";
import { createSupabaseServerClient } from "./supabaseServer";
import type { Role } from "./access";

/**
 * Staff self sign-up. Asks the database to add the signed-in person as a marker if (and only if) every rule in
 * claim_marker_access() holds: setting on, verified Google email at an allowed domain, not blocked. Runs on the server only.
 * Cached per request so one page render asks at most once. Returns the role, or null when the person was not added.
 * Never throws: any problem means "not added", and the person sees the normal "Ask an admin for access" page.
 */
export const claimMarkerAccess = cache(async (): Promise<Role | null> => {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc("claim_marker_access");
    if (error) return null;
    return data === "marker" || data === "admin" ? data : null;
  } catch {
    return null;
  }
});
