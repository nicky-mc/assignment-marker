<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->


# Marking prompt

The tone guide (`lib/toneGuide.ts`) is part of the measured marking prompt, so any change to it is a logged experiment.

# Sign-in, rubric database and swapping them out (thin and removable)

Two switches, both defaulting to today's behaviour: `AUTH_MODE=off|on` and `RUBRIC_SOURCE=file|supabase`. In production, `AUTH_MODE` must be `on` or `/api/mark` and every page refuse to serve (fail closed). Supabase holds rubrics, staff emails and roles only, never learner data. Next.js 16 calls middleware `proxy.ts`.

How TED would swap each part:
- **Sign-in:** everything is in `lib/auth/`, plus `proxy.ts`, `app/login`, `app/auth/*`, `app/no-access` and `components/SignInButton|SignOutButton|UserMenu`. Replace `getAccess()` and `getSessionEmail()` in `lib/auth/access.ts` with TED's identity provider and keep the `Access` return shape. The route and pages only call those.
- **Allowlist and roles:** the `allowed_users` table is read inside `getAccess()`. Replace that query with TED's own role lookup.
- **Rubrics:** everything reads through `lib/rubricStore.ts` (`getRubric`, `listCourses`, `listRubrics`). Replace the `supabaseStore` object with TED's implementation, or set `RUBRIC_SOURCE=file`. `lib/rubrics.ts` stays as the file source and the seed. (`lib/marking.ts` still imports the `Rubric` type and band text from `lib/rubrics.ts`; that is types and constants only.)
- **Rate limit:** `lib/auth/rateLimit.ts` is in memory and per server instance; swap for a shared store if there are several instances.
- Supabase setup: `supabase/migrations/001_init.sql`; seed with `scripts/seed-rubrics.ts`, verify with `scripts/check-rubrics-db.ts`. The secret key is used only by those scripts, never by the running app.
