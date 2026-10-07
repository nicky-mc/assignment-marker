"use client";

import { useRef, useState, useTransition } from "react";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import Alert from "@/components/Alert";
import { AppCard } from "@/components/AppCard";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { addPersonAction, removePersonAction, setRoleAction, unblockEmailAction } from "@/lib/userAdmin/actions";
import { cn } from "@/lib/utils";

interface Person {
  email: string;
  role: "admin" | "marker";
  added_by: string | null;
  created_at: string;
  is_new: boolean;
}

interface Removed {
  email: string;
  blocked_by: string | null;
  blocked_at: string;
}

type Confirm = { type: "admin" | "marker" | "remove"; email: string } | null;

const fmt = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { dateStyle: "medium" });
const initials = (email: string) => email.split("@")[0].replace(/[^a-z0-9]/gi, "").slice(0, 2).toUpperCase() || "?";

// The role is always text in the pill, never colour alone.
function RolePill({ role }: { role: Person["role"] }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border-2 px-3 py-0.5 text-sm font-semibold",
        role === "admin" ? "border-brand-primary bg-brand-primary text-brand-secondary dark:border-surface-border" : "border-brand-secondary bg-brand-secondary text-brand-primary",
      )}
    >
      {role === "admin" ? "Admin" : "Marker"}
    </span>
  );
}

const COPY: Record<NonNullable<Confirm>["type"], { title: (e: string) => string; body: string; button: string }> = {
  admin: { title: (e) => `Make ${e} an admin?`, body: "Admins can approve rubrics and manage users.", button: "Make admin" },
  marker: { title: (e) => `Make ${e} a marker?`, body: "They will no longer be able to edit rubrics or manage users.", button: "Make marker" },
  remove: { title: (e) => `Remove access for ${e}?`, body: "They will no longer be able to sign in to the tool. They will not be added again automatically unless you choose Allow again.", button: "Remove access" },
};

export default function UsersPanel({ people, removed, me, allowedDomain }: { people: Person[]; removed: Removed[]; me: string; allowedDomain: string | null }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("marker");
  const [addError, setAddError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const emailRef = useRef<HTMLInputElement>(null);
  const lastTrigger = useRef<HTMLElement | null>(null);

  const outsideDomain = Boolean(allowedDomain && email.includes("@") && email.trim().toLowerCase().split("@").pop() !== allowedDomain.toLowerCase());

  function add(e: React.FormEvent) {
    e.preventDefault();
    setAddError(null);
    const value = email.trim();
    const problem = !value
      ? "Enter an email address."
      : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
        ? "Enter a valid email address, for example name@techeducators.co.uk."
        : null;
    if (problem) {
      setAddError(problem);
      emailRef.current?.focus();
      return;
    }
    startTransition(async () => {
      const r = await addPersonAction(email, role);
      if (r.ok) {
        toast.success(r.message);
        setEmail("");
        setRole("marker");
      } else {
        setAddError(r.message);
        toast.error(r.message);
      }
    });
  }

  function confirmAction() {
    if (!confirm) return;
    const { type, email: target } = confirm;
    setActionError(null);
    startTransition(async () => {
      const r = type === "remove" ? await removePersonAction(target) : await setRoleAction(target, type);
      if (r.ok) {
        toast.success(r.message);
        setConfirm(null);
      } else {
        setActionError(r.message);
        toast.error(r.message);
        setConfirm(null);
      }
    });
  }

  return (
    <>
      <AppCard title="Add a person" helper="They sign in with Google using this address. No email is sent.">
        <form onSubmit={add} className="flex flex-col gap-3" noValidate>
          <div className="flex flex-col gap-1">
            <label htmlFor="person-email" className="font-medium">
              Email address
            </label>
            <Input
              id="person-email"
              ref={emailRef}
              type="email"
              placeholder="name@techeducators.co.uk"
              autoComplete="off"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={addError ? true : undefined}
              aria-describedby={[addError ? "add-error" : "", outsideDomain ? "domain-warning" : ""].filter(Boolean).join(" ") || undefined}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="person-role" className="font-medium">
              Role
            </label>
            <NativeSelect id="person-role" value={role} onChange={(e) => setRole(e.target.value)} className="sm:max-w-56">
              <option value="marker">Marker</option>
              <option value="admin">Admin</option>
            </NativeSelect>
          </div>
          {outsideDomain && (
            <Alert variant="warning" title="Address outside your domain">
              <span id="domain-warning">This address is outside {allowedDomain}. You can still add it, but please check it is right.</span>
            </Alert>
          )}
          {addError && (
            <p id="add-error" role="alert" className="text-sm font-semibold text-danger">
              {addError}
            </p>
          )}
          <div>
            <Button type="submit" disabled={pending}>
              {pending && !confirm ? "Adding..." : "Add person"}
            </Button>
          </div>
        </form>
      </AppCard>

      <AppCard title="People with access">
        {actionError && (
          <Alert variant="error" title="That did not work">
            {actionError}
          </Alert>
        )}
        {people.length === 0 ? (
          <p>No one has been added yet.</p>
        ) : (
          <ul className="flex flex-col">
            {people.map((p) => {
              const you = p.email === me;
              return (
                <li key={p.email} className="flex flex-wrap items-center gap-3 border-b border-surface-border/40 py-3 first:pt-0 last:border-b-0 last:pb-0">
                  <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-primary text-sm font-semibold text-brand-secondary dark:bg-brand-secondary dark:text-brand-primary">
                    {initials(p.email)}
                  </span>
                  <div className="min-w-0 flex-1 basis-48">
                    <p className="break-all font-medium">
                      {p.email}
                      {you && <span className="ml-2 rounded-full border-2 border-surface-border px-2 py-0.5 text-[12px] font-semibold">You</span>}
                      {p.is_new && <span className="ml-2 rounded-full border-2 border-surface-border px-2 py-0.5 text-[12px] font-semibold">New</span>}
                      {p.added_by === "self sign-up" && <span className="ml-2 rounded-full border-2 border-surface-border px-2 py-0.5 text-[12px] font-semibold">Self sign-up</span>}
                    </p>
                    <p className="text-[13px] text-ink-2">
                      {p.added_by === "self sign-up" ? "joined by self sign-up" : `added by ${p.added_by ?? "unknown"}`}, {fmt(p.created_at)}
                    </p>
                  </div>
                  <RolePill role={p.role} />
                  <DropdownMenu>
                    <DropdownMenuTrigger className={cn(buttonVariants({ variant: "outline", size: "icon" }))} aria-label={`Actions for ${p.email}`} onClick={(e) => (lastTrigger.current = e.currentTarget)}>
                      <MoreHorizontal aria-hidden="true" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-auto min-w-52 border-2 border-border p-2">
                      <DropdownMenuItem disabled={you} className="min-h-10 px-2 text-base" onClick={() => setConfirm({ type: p.role === "admin" ? "marker" : "admin", email: p.email })}>
                        {p.role === "admin" ? "Make marker" : "Make admin"}
                      </DropdownMenuItem>
                      <DropdownMenuItem variant="destructive" disabled={you} className="min-h-10 px-2 text-base" onClick={() => setConfirm({ type: "remove", email: p.email })}>
                        Remove access
                      </DropdownMenuItem>
                      {you && <p className="max-w-52 px-2 pb-1 text-[13px] text-ink-2">You can&apos;t change your own access.</p>}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </li>
              );
            })}
          </ul>
        )}
      </AppCard>

      <AppCard title="Removed people" helper="Removed people are not added again by staff sign-up. Allow again lets them be added automatically the next time they sign in, if sign-up is on for their address.">
        {removed.length === 0 ? (
          <p>No one has been removed.</p>
        ) : (
          <ul className="flex flex-col">
            {removed.map((r) => (
              <li key={r.email} className="flex flex-wrap items-center gap-3 border-b border-surface-border/40 py-3 first:pt-0 last:border-b-0 last:pb-0">
                <div className="min-w-0 flex-1 basis-48">
                  <p className="break-all font-medium">{r.email}</p>
                  <p className="text-[13px] text-ink-2">
                    removed by {r.blocked_by ?? "unknown"}, {fmt(r.blocked_at)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={pending}
                  aria-label={`Allow ${r.email} again`}
                  onClick={() =>
                    startTransition(async () => {
                      const res = await unblockEmailAction(r.email);
                      if (res.ok) toast.success(res.message);
                      else toast.error(res.message);
                    })
                  }
                >
                  Allow again
                </Button>
              </li>
            ))}
          </ul>
        )}
      </AppCard>

      <AlertDialog open={confirm !== null} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent finalFocus={lastTrigger}>
          {confirm && (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>{COPY[confirm.type].title(confirm.email)}</AlertDialogTitle>
                <AlertDialogDescription>{COPY[confirm.type].body}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <Button type="button" variant={confirm.type === "remove" ? "destructive" : "default"} onClick={confirmAction} disabled={pending}>
                  {pending ? "Working..." : COPY[confirm.type].button}
                </Button>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
