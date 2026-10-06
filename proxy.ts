import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Next.js 16 calls this file "proxy" (it was "middleware"). It is only an optimistic first check:
// the real checks (verified session AND allowlist) run again on the server in /api/mark and in each page.
// It reads the switches directly (not via lib/auth) to stay light.

const PUBLIC_PATHS = ["/login", "/auth/callback", "/config-error"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authOn = process.env.AUTH_MODE === "on";

  // Fail closed: production without sign-in does not serve the marking API or the app.
  if (process.env.NODE_ENV === "production" && !authOn) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Marking is unavailable: this deployment is not configured safely." }, { status: 503 });
    }
    if (pathname !== "/config-error") return NextResponse.redirect(new URL("/config-error", request.url));
    return NextResponse.next();
  }

  // AUTH_MODE off (development): nothing changes.
  if (!authOn) return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
          Object.entries(headers ?? {}).forEach(([key, value]) => response.headers.set(key, value));
        },
      },
    },
  );

  // getClaims verifies the token signature, and refreshes the session cookie when needed.
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims);

  if (!signedIn && !PUBLIC_PATHS.includes(pathname)) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Please sign in to mark." }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mjs|js|css)$).*)"],
};
