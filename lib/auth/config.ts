// The two switches. The defaults keep the app exactly as it was before sign-in existed.
//   AUTH_MODE=off|on          (default off)
//   RUBRIC_SOURCE=file|supabase (default file)

export type AuthMode = "off" | "on";
export type RubricSource = "file" | "supabase";

export function authMode(): AuthMode {
  return process.env.AUTH_MODE === "on" ? "on" : "off";
}

export function rubricSource(): RubricSource {
  return process.env.RUBRIC_SOURCE === "supabase" ? "supabase" : "file";
}

/** Fail closed: a production build with sign-in switched off must not serve the marking API. */
export function isUnsafeProduction(): boolean {
  return process.env.NODE_ENV === "production" && authMode() !== "on";
}

export function supabaseEnv(): { url: string; publishableKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) {
    throw new Error("Supabase is not configured: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are required.");
  }
  return { url, publishableKey };
}
