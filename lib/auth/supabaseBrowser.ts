import { createBrowserClient } from "@supabase/ssr";

// Browser client: publishable key only. Used only to start the Google sign-in.
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
