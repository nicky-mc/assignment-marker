"use client";

import { useRef, useState, useTransition } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { domainProblem, MAX_SIGNUP_DOMAINS, normaliseDomain, validateDomains } from "@/lib/signupRules";
import { setSignupSettingsAction } from "@/lib/userAdmin/actions";
import { cn } from "@/lib/utils";

interface Change {
  enabled: boolean;
  domains: string[];
}

const sameList = (a: string[], b: string[]) => a.length === b.length && a.every((x, i) => x === b[i]);
const listText = (domains: string[]) => domains.map((d) => `@${d}`).join(", ");

// Staff sign-up: on or off, and which email domains may join automatically (as markers only). Every change asks first.
export default function SignupSettingsCard({ enabled, domains }: { enabled: boolean; domains: string[] }) {
  const [draft, setDraft] = useState<string[]>(domains);
  const [input, setInput] = useState("");
  const [problem, setProblem] = useState<string | null>(null);
  const [change, setChange] = useState<Change | null>(null);
  const [pending, startTransition] = useTransition();
  const triggerRef = useRef<HTMLElement | null>(null);

  const domainsChanged = !sameList(draft, domains);
  const state = enabled ? `On for ${listText(domains)}` : "Off";

  function addDomain() {
    const d = normaliseDomain(input);
    if (!d) {
      setProblem("Enter a domain like techeducators.co.uk.");
      return;
    }
    const p = domainProblem(d);
    if (p) {
      setProblem(p);
      return;
    }
    if (draft.includes(d)) {
      setProblem(`${d} is already in the list.`);
      return;
    }
    if (draft.length >= MAX_SIGNUP_DOMAINS) {
      setProblem(`You can allow at most ${MAX_SIGNUP_DOMAINS} domains.`);
      return;
    }
    setDraft([...draft, d]);
    setInput("");
    setProblem(null);
  }

  // Opens the confirmation. The same rules the database applies are checked first, for an instant message.
  function ask(next: Change, opener: HTMLElement | null) {
    const check = validateDomains(next.domains, next.enabled);
    if (!check.ok) {
      setProblem(check.message);
      return;
    }
    setProblem(null);
    triggerRef.current = opener;
    setChange({ enabled: next.enabled, domains: check.domains });
  }

  function confirm() {
    if (!change) return;
    const c = change;
    startTransition(async () => {
      const r = await setSignupSettingsAction(c.enabled, c.domains);
      if (r.ok) {
        toast.success(r.message);
        setChange(null);
      } else {
        setProblem(r.message);
        toast.error(r.message);
        setChange(null);
      }
    });
  }

  return (
    <AppCard title="Staff sign-up" helper="Anyone who can sign in with these addresses can mark submissions, which uses API credits.">
      <p className="font-medium" role="status">
        {state}
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-labelledby="signup-switch-label"
          onClick={(e) => ask({ enabled: !enabled, domains: draft }, e.currentTarget)}
          className={cn(
            "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border-2 border-field-border",
            enabled ? "bg-brand-primary dark:bg-brand-secondary" : "bg-field",
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              "absolute size-4 rounded-full transition-transform duration-150 motion-reduce:transition-none",
              enabled ? "translate-x-6 bg-brand-secondary dark:bg-brand-primary" : "translate-x-1 bg-ink",
            )}
          />
        </button>
        <span id="signup-switch-label" className="min-w-0 flex-1 basis-56">
          Add staff as markers automatically on first sign-in
        </span>
        <span className="text-sm font-semibold">{enabled ? "On" : "Off"}</span>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="signup-domain" className="font-medium">
          Allowed domains
        </label>
        {draft.length > 0 ? (
          <ul className="flex flex-wrap items-center gap-2">
            {draft.map((d) => (
              <li key={d}>
                <Badge className="gap-1.5 pr-1.5">
                  @{d}
                  <button
                    type="button"
                    onClick={() => {
                      setDraft(draft.filter((x) => x !== d));
                      setProblem(null);
                    }}
                    aria-label={`Remove ${d}`}
                    className="flex size-6 items-center justify-center rounded-full hover:bg-brand-secondary hover:text-brand-primary"
                  >
                    <X aria-hidden="true" />
                  </button>
                </Badge>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm">No domains yet.</p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <Input
            id="signup-domain"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setProblem(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addDomain();
              }
            }}
            placeholder="techeducators.co.uk"
            autoComplete="off"
            aria-invalid={problem ? true : undefined}
            aria-describedby={problem ? "signup-problem" : "signup-domain-help"}
            className="w-auto min-w-52 flex-1"
          />
          <Button type="button" variant="outline" onClick={addDomain}>
            Add domain
          </Button>
        </div>
        <p id="signup-domain-help" className="text-[13px] text-ink-2">
          Only addresses that end exactly with one of these are added. Subdomains and look-alike names do not match. Free email services are not allowed.
        </p>
        {problem && (
          <p id="signup-problem" role="alert" className="text-sm font-semibold text-danger">
            {problem}
          </p>
        )}
      </div>

      {domainsChanged && (
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" onClick={(e) => ask({ enabled, domains: draft }, e.currentTarget)}>
            Save domains
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setDraft(domains);
              setProblem(null);
            }}
          >
            Discard changes
          </Button>
        </div>
      )}

      <AlertDialog open={change !== null} onOpenChange={(o) => !o && setChange(null)}>
        <AlertDialogContent finalFocus={triggerRef}>
          {change && (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {!change.enabled ? "Turn off staff sign-up?" : enabled ? "Change the allowed domains?" : "Turn on staff sign-up?"}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {change.enabled
                    ? `From now on, anyone who signs in with a verified Google address at ${listText(change.domains)} is added as a marker automatically. They can mark submissions, which uses API credits. Admins are never added this way.`
                    : "New staff will need an admin to add them. People who already have access keep it."}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <Button type="button" onClick={confirm} disabled={pending}>
                  {pending ? "Saving..." : change.enabled ? (enabled ? "Save domains" : "Turn on") : "Turn off"}
                </Button>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </AppCard>
  );
}
