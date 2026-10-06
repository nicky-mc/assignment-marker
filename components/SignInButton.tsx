"use client";

import { createSupabaseBrowserClient } from "@/lib/auth/supabaseBrowser";

export default function SignInButton() {
  async function signIn() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }
  return (
    <button
      type="button"
      onClick={signIn}
      className="self-start rounded-md bg-brand-primary text-brand-secondary px-4 py-2 font-medium"
    >
      Sign in with Google
    </button>
  );
}
