"use client";

import { Button } from "@/components/ui/button";
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
    <Button type="button" onClick={signIn} className="self-start">
      Sign in with Google
    </Button>
  );
}
