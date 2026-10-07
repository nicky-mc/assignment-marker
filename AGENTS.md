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

# Rubric admin screens

Admins manage rubrics at `/admin/rubrics` (create, edit, import and export JSON, approve, retire, try a draft). Code: `lib/rubricAdmin/` (`validate.ts` rules, `store.ts` database access as the signed-in admin, `actions.ts` server actions), `components/admin/`, `app/admin/rubrics/`. Rubric text goes into the marking prompt, so it is validated as untrusted input (plain text, limits, warnings on instruction-like phrases). Only `approved` rubrics are used for marking; drafts are tried only by admins through `/api/mark` with `draft: true`. History is append-only. Needs `supabase/migrations/002_rubric_admin.sql`. To swap for TED's own system, replace `lib/rubricAdmin/store.ts` and keep `lib/rubricAdmin/validate.ts`. Uses the experimental `authInterrupts` flag (`next.config.ts`) for a real 403 page.

Rendering and hosting: every page or route that calls `requirePageAccess` or `requireAdmin` must be dynamic (they await `connection()`), so check the route list at the end of `npm run build` shows `ƒ`, not `○`. `NEXT_PUBLIC_` variables are inlined at build time, so set them in the host before building; server-only variables (`AUTH_MODE`, `RUBRIC_SOURCE`, the secret key, the Anthropic key) are read at runtime.

# Design system

Tokens live in `app/globals.css` (light and dark, set once; shadcn's tokens are mapped onto them). Tailwind names: `bg-page`, `bg-surface` + `border-surface-border`, `bg-field` + `border-field-border`, `text-ink`, `text-ink-2`, `text-placeholder`, `text-danger`, `bg-brand-primary` (purple #3F1046), `bg-brand-secondary` (green #2AD385).
- Light: page #F0EBF2, card #F7F3F8 (2px #3F1046 border), field #FBF9FC (2px #3F1046 border), text #3F1046, secondary text #5F4468, placeholder #6F5A78, focus ring 3px #3F1046 offset 2px.
- Dark: page #1C0A20, card #2B1230 (2px #8B5A97 border), field #241029 (2px #8B5A97 border), text #F3E9F5, secondary text #CDB8D2, placeholder #BFA9C6, focus ring 3px #2AD385 offset 2px.
- Purple cards (`.purple-card`): #3F1046, green titles and labels, #EADCF0 body text, fields with a 1.5px green border. Green summary card: #2AD385 with #3F1046 text. Primary button: purple fill, green text, 10px corners. Secondary button: transparent with a 2px border.
- Card anatomy (`components/AppCard.tsx`): 14px corners, 20px padding, header row (optional step badge, h2 title at 18px Space Grotesk, optional right-aligned action), body, optional helper text (13px, secondary colour). `HeroCard` is the purple title card, `SummaryCard` is the green result card. 16px between cards.
- Use `components/ui/*` (shadcn, Base UI based) for Button, Badge, Input, Textarea, Label, DropdownMenu, Card, Separator, Skeleton, Sonner. Selects are native, via `components/ui/native-select.tsx`. Every text field, text area and select uses the `.field-control` class. The theme is the existing `data-theme` toggle (no next-themes).
- Rules: never use pure white or pure black (no `bg-white`, `#fff`, `text-white`). In dark mode no form field is ever white. No hard-coded colours in components: use a token, and always pair text with a token that meets contrast (text 5.9:1 or better, borders 3.3:1 or better). Status is never shown by colour alone: pair it with text or an icon. Transitions are 150ms and switch off for `prefers-reduced-motion`.
- The header menu is `components/HeaderMenu.tsx` (server: decides items from the role) and `components/AppMenu.tsx` (client dropdown). Add a menu item only when its page exists.

Rubric library notes: `/rubrics` and `/rubrics/[id]` are read-only for everyone signed in; admins also see drafts and retired rubrics. When `RUBRIC_SOURCE=file` admins see the plain-language line in `lib/rubricNotes.ts` inside the hero card (editing needs `RUBRIC_SOURCE=supabase`). Never print environment variable names in the interface. The rubric carousel (`components/RubricLibrary.tsx`) uses native scrolling with `useDragScroll` for mouse drag only; its scrollbar is hidden (`.scroll-row`), so keep the Previous and Next buttons working.

Library admin: admins editing rubrics from the database (`RUBRIC_SOURCE=supabase`) get edit in place on `/rubrics/[id]` (`components/admin/RubricEditor.tsx`), Add assignment (`/rubrics/new?course=`), New course and More (Import JSON, Export all) in the library header, Approve and Retire in a confirm dialog, Try draft in a sheet, and a history timeline. It uses the existing server actions only: `saveRubricAction` updates the open draft in place, or creates the next draft version when the latest version is live or retired. The old `/admin/rubrics*` pages now redirect to the library (the actions still redirect there with a message, which is passed on). Markers never receive admin data.

User management and deletes: `/admin/users` (admins only) lists people, changes roles and removes access through the database functions in `supabase/migrations/003_admin_users_and_rubric_delete.sql` (`add_allowed_user`, `set_user_role`, `remove_allowed_user`), which re-check the admin role, refuse to demote or remove the last admin, refuse to remove your own access, and write `user_access_history`. `allowed_users` is read-only through the API; the first admin is still added in the SQL editor. Admins can delete a rubric (all versions, only when none is live) or an empty course through `delete_rubric` and `delete_course`, which keep a full copy in `rubric_deletions` (shown as the Deletion log). Direct deletes stay blocked by the revoked delete privilege from migration 002; only these security definer functions can delete. Optional `ALLOWED_EMAIL_DOMAIN` makes the add form warn about addresses outside it.
