"use client";

import { useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AppCard } from "@/components/AppCard";
import { HeroCard } from "@/components/HeroCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveRubricAction } from "@/lib/rubricAdmin/actions";
import { EMPTY_STATE, type FormState } from "@/lib/rubricAdmin/formState";
import { suggestRubricId } from "@/lib/rubricAdmin/slug";
import { LIMITS, validateRubric } from "@/lib/rubricAdmin/validate";
import { cn } from "@/lib/utils";
import AutoTextarea from "./AutoTextarea";
import StatusActionDialog from "./StatusActionDialog";
import TryDraftSheet from "./TryDraftSheet";

type BlockKey = "title" | "overview" | "requirements" | "stretchGoal" | "bands";
const ALL_BLOCKS: BlockKey[] = ["title", "overview", "requirements", "stretchGoal", "bands"];
const EDIT_ALL: BlockKey[] = ["title", "overview", "requirements", "stretchGoal"];

export interface EditorValues {
  week: string;
  title: string;
  overview: string;
  requirements: string;
  stretchGoal: string;
  /** Five texts for bands 0 to 4, WITHOUT the "N - " prefix (the existing action adds it). Empty strings when generic bands apply. */
  bands: string[];
}

export interface EditorProps {
  mode: "view" | "create";
  rubricId: string;
  courseId: string;
  courseName: string;
  baseline: EditorValues;
  liveVersion: number | null;
  draftVersion: number | null;
  shownStatus: "approved" | "draft" | "retired";
  shownVersion: number;
  admin: boolean;
  /** Editing controls exist only for admins reading rubrics from the database. Decided on the server. */
  canEdit: boolean;
  /** A quiet line inside the hero (for example why editing is off). */
  heroNote?: string;
  genericBands: string[];
  detailsSlot: ReactNode;
  historySlot?: ReactNode;
}

const BODY = "max-w-[70ch] whitespace-pre-line break-words text-base";
const ON_PURPLE_SECONDARY = "border-brand-secondary bg-transparent text-brand-secondary hover:bg-brand-secondary/15";
const ON_PURPLE_PRIMARY = "border-brand-secondary bg-brand-secondary text-brand-primary hover:bg-brand-secondary/90";

const sameBands = (a: string[], b: string[]) => a.length === b.length && a.every((x, i) => x === b[i]);

export default function RubricEditor(props: EditorProps) {
  const { mode, courseId, courseName, baseline, liveVersion, draftVersion, admin, canEdit, genericBands } = props;
  const router = useRouter();
  const [values, setValues] = useState<EditorValues>(baseline);
  const [open, setOpen] = useState<Set<BlockKey>>(() => (mode === "create" ? new Set(ALL_BLOCKS) : new Set()));
  const [id, setId] = useState(props.rubricId);
  const [idTouched, setIdTouched] = useState(false);
  const [ack, setAck] = useState(false);
  const [state, setState] = useState<FormState>(EMPTY_STATE);
  const [pending, startTransition] = useTransition();
  const summaryRef = useRef<HTMLDivElement>(null);

  const effectiveId = mode === "create" ? (idTouched ? id : suggestRubricId(courseId, values.week, values.title)) : props.rubricId;
  const errors = state.errors ?? {};
  const set = <K extends keyof EditorValues>(k: K, v: EditorValues[K]) => setValues((p) => ({ ...p, [k]: v }));

  const changed = (k: BlockKey) =>
    k === "bands" ? !sameBands(values.bands, baseline.bands) : k === "title" ? values.title !== baseline.title || values.week !== baseline.week : values[k] !== baseline[k];
  const dirty =
    mode === "create"
      ? Boolean(values.week || values.title || values.overview || values.requirements || values.stretchGoal || values.bands.some(Boolean))
      : Array.from(open).some(changed);

  // The same rules the server applies, so warnings show next to the field as you type.
  const warnings = useMemo(
    () =>
      validateRubric({
        id: effectiveId || "x",
        courseId,
        courseName,
        week: values.week || "x",
        title: values.title || "x",
        overview: values.overview || "x",
        requirements: values.requirements || "x",
        stretchGoal: values.stretchGoal || "x",
        bandDescriptions: values.bands.some((b) => b.trim()) ? values.bands.map((b, i) => (b.trim() ? `${i} - ${b.trim()}` : "")) : undefined,
      }).warnings,
    [effectiveId, courseId, courseName, values],
  );
  const needsAck = warnings.length > 0;
  const blockOf = (field: string): BlockKey => (field.startsWith("bandDescriptions") ? "bands" : field === "week" || field === "title" ? "title" : (field as BlockKey));
  const warningsFor = (k: BlockKey) => (open.has(k) ? warnings.filter((w) => blockOf(w.field) === k) : []);

  // Warn before leaving with unsaved changes: closing the tab, and clicking links inside the app.
  useEffect(() => {
    if (!dirty || pending) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || e.metaKey || e.ctrlKey || e.shiftKey || a.hasAttribute("download")) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin || (url.pathname === window.location.pathname && url.search === window.location.search)) return;
      if (!window.confirm("You have unsaved changes. Leave without saving?")) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [dirty, pending]);

  function openBlocks(keys: BlockKey[]) {
    setOpen((prev) => new Set([...prev, ...keys]));
  }
  function closeBlock(k: BlockKey) {
    setValues((p) => (k === "bands" ? { ...p, bands: baseline.bands } : k === "title" ? { ...p, title: baseline.title, week: baseline.week } : { ...p, [k]: baseline[k] }));
    setOpen((prev) => {
      const next = new Set(prev);
      next.delete(k);
      return next;
    });
    setState(EMPTY_STATE);
  }
  function cancelAll() {
    if (mode === "create") {
      router.push("/rubrics");
      return;
    }
    setValues(baseline);
    setOpen(new Set());
    setState(EMPTY_STATE);
    setAck(false);
  }

  function save() {
    if (needsAck && !ack) {
      setState({ errors: { acknowledged: "Please tick the box to confirm you have read this, then save again." }, warnings });
      return;
    }
    const fd = new FormData();
    fd.set("mode", mode === "create" ? "create" : "edit");
    fd.set("id", effectiveId);
    fd.set("courseId", courseId);
    fd.set("week", values.week);
    fd.set("title", values.title);
    fd.set("overview", values.overview);
    fd.set("requirements", values.requirements);
    fd.set("stretchGoal", values.stretchGoal);
    values.bands.forEach((b, i) => fd.set(`band${i}`, b)); // the existing action adds "N - " when it is missing
    if (ack) fd.set("acknowledged", "yes");
    startTransition(async () => {
      // On success the action redirects to the rubric page with a message, which replaces this page.
      const next = await saveRubricAction(EMPTY_STATE, fd);
      setState(next);
      toast.error(next.message ?? "Please fix the problems shown, then save again.");
      summaryRef.current?.focus();
    });
  }

  const editing = canEdit && open.size > 0;
  const fieldError = (key: string) => errors[key];

  const counter = (len: number, limit: number, id: string) => (
    <p id={id} className={cn("text-[13px]", len > limit ? "font-semibold text-danger" : "text-ink-2")}>
      {len} / {limit}
    </p>
  );

  const warningPanel = (k: BlockKey) => {
    const w = warningsFor(k);
    if (w.length === 0) return null;
    return (
      <div role="status" className="flex flex-col gap-2 rounded-[10px] border-2 border-amber-700 bg-amber-100 px-3 py-3 text-amber-950">
        <p className="font-semibold">Please read this before saving</p>
        <p className="text-sm">
          This text contains wording that can look like an instruction to the AI ({Array.from(new Set(w.map((x) => `"${x.phrase}"`))).join(", ")}). Rubric text goes
          straight into the marking prompt, so it should only describe the assignment.
        </p>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} className="mt-0.5 size-5 accent-brand-primary" />
          I have read this and it only describes the assignment
        </label>
      </div>
    );
  };

  const blockFooter = (k: BlockKey) => (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {mode === "view" && (
        <Button type="button" variant="outline" size="sm" onClick={() => closeBlock(k)}>
          Cancel
        </Button>
      )}
      <Button type="button" size="sm" onClick={save} disabled={pending}>
        {pending ? "Saving..." : mode === "create" ? "Create draft" : "Save draft"}
      </Button>
    </div>
  );

  const textBlock = (k: Exclude<BlockKey, "title" | "bands">, title: string, limit: number) => {
    const o = canEdit && open.has(k);
    const fid = `field-${k}`;
    const err = fieldError(k);
    return (
      <AppCard
        title={o ? <label htmlFor={fid}>{title}</label> : title}
        action={
          canEdit && !o ? (
            <Button type="button" variant="outline" size="sm" onClick={() => openBlocks([k])}>
              Edit<span className="sr-only"> {title}</span>
            </Button>
          ) : undefined
        }
      >
        {o ? (
          <>
            <AutoTextarea
              id={fid}
              value={values[k]}
              onChange={(v) => set(k, v)}
              minRows={4}
              aria-invalid={err ? true : undefined}
              aria-describedby={[`${fid}-count`, err ? `${fid}-error` : ""].filter(Boolean).join(" ")}
            />
            {err && (
              <p id={`${fid}-error`} role="alert" className="text-sm font-semibold text-danger">
                {err}
              </p>
            )}
            {warningPanel(k)}
            <div className="flex flex-wrap items-center justify-between gap-2">
              {counter(values[k].trim().length, limit, `${fid}-count`)}
              {blockFooter(k)}
            </div>
          </>
        ) : (
          <p className={BODY}>{values[k]}</p>
        )}
      </AppCard>
    );
  };

  const titleOpen = canEdit && open.has("title");
  const bandsOpen = canEdit && open.has("bands");
  const usesGeneric = values.bands.every((b) => !b.trim());
  const shownBands = usesGeneric ? genericBands : values.bands;

  const heroActions = canEdit && mode === "view" ? (
    <>
      {!EDIT_ALL.every((k) => open.has(k)) && (
        <Button type="button" variant="outline" size="sm" className={ON_PURPLE_SECONDARY} onClick={() => openBlocks(EDIT_ALL)}>
          Edit all
        </Button>
      )}
      {!titleOpen && (
        <Button type="button" variant="outline" size="sm" className={ON_PURPLE_SECONDARY} onClick={() => openBlocks(["title"])}>
          Edit title
        </Button>
      )}
      {draftVersion !== null && <TryDraftSheet rubricId={props.rubricId} version={draftVersion} triggerClassName={ON_PURPLE_SECONDARY} />}
      {draftVersion !== null && (
        <StatusActionDialog
          intent="approve"
          rubricId={props.rubricId}
          version={draftVersion}
          triggerLabel="Approve"
          title={`Approve version ${draftVersion}?`}
          description="Approving makes this version live for marking and retires the previous version."
          confirmLabel="Approve"
          triggerClassName={ON_PURPLE_PRIMARY}
        />
      )}
      {liveVersion !== null && (
        <StatusActionDialog
          intent="retire"
          rubricId={props.rubricId}
          version={liveVersion}
          triggerLabel="Retire"
          title={`Retire version ${liveVersion}?`}
          description="It stays in the history but can no longer be used for marking."
          confirmLabel="Retire"
          triggerClassName={ON_PURPLE_SECONDARY}
        />
      )}
      <a
        href={`/admin/rubrics/export?id=${encodeURIComponent(props.rubricId)}&version=${props.shownVersion}`}
        className={cn(buttonVariants({ variant: "outline", size: "sm" }), ON_PURPLE_SECONDARY)}
      >
        Export
      </a>
    </>
  ) : undefined;

  const statusBadges =
    mode === "create" ? null : admin && (liveVersion !== null || draftVersion !== null) ? (
      <span className="flex flex-wrap items-center gap-2">
        {liveVersion !== null && <StatusBadge status="approved" version={liveVersion} admin onPurple />}
        {draftVersion !== null && (
          <>
            <StatusBadge status="draft" version={draftVersion} admin onPurple />
            {liveVersion !== null && <span className="text-[13px] text-purple-body">Draft pending</span>}
          </>
        )}
      </span>
    ) : (
      <StatusBadge status={props.shownStatus} version={props.shownVersion} admin={admin} onPurple />
    );

  const errorEntries = Object.entries(errors).filter(([k]) => k !== "acknowledged");

  return (
    <>
      <HeroCard
        eyebrow={
          mode === "create" ? (
            <span className="flex flex-col gap-1">
              <label htmlFor="field-week" className="font-medium">
                Week
              </label>
              <Input
                id="field-week"
                value={values.week}
                onChange={(e) => set("week", e.target.value)}
                placeholder="Week 3"
                aria-invalid={errors.week ? true : undefined}
                className="min-w-40"
              />
              {errors.week && (
                <span role="alert" className="text-sm font-semibold text-danger">
                  {errors.week}
                </span>
              )}
            </span>
          ) : (
            values.week
          )
        }
        aside={statusBadges}
        title={
          titleOpen || mode === "create" ? (
            <span className="flex flex-col gap-1">
              <label htmlFor="field-title" className="text-base font-medium">
                Title
              </label>
              <Input
                id="field-title"
                value={values.title}
                onChange={(e) => set("title", e.target.value)}
                aria-invalid={errors.title ? true : undefined}
                aria-describedby="field-title-count"
                className="h-12 text-xl font-semibold"
              />
              <span id="field-title-count" className={cn("text-[13px] font-normal", values.title.trim().length > LIMITS.title ? "text-danger" : "text-purple-body")}>
                {values.title.trim().length} / {LIMITS.title}
              </span>
              {errors.title && (
                <span role="alert" className="text-sm font-semibold text-danger">
                  {errors.title}
                </span>
              )}
              {titleOpen && mode === "view" && (
                <span className="flex gap-2 pt-1">
                  <Button type="button" variant="outline" size="sm" className={ON_PURPLE_SECONDARY} onClick={() => closeBlock("title")}>
                    Cancel
                  </Button>
                  <Button type="button" size="sm" className={ON_PURPLE_PRIMARY} onClick={save} disabled={pending}>
                    Save draft
                  </Button>
                </span>
              )}
              {warningPanel("title")}
            </span>
          ) : (
            values.title
          )
        }
        note={props.heroNote}
        actions={heroActions}
      />

      {mode === "create" && (
        <details className="rounded-[10px] border-2 border-surface-border px-4 py-3">
          <summary className="cursor-pointer font-medium">Advanced</summary>
          <div className="mt-3 flex max-w-[70ch] flex-col gap-1">
            <label htmlFor="field-id" className="font-medium">
              Id
            </label>
            <p className="text-[13px] text-ink-2">Made from the course, week and title. You can change it until the first save; after that it is locked.</p>
            <Input
              id="field-id"
              value={effectiveId}
              onChange={(e) => {
                setId(e.target.value);
                setIdTouched(true);
              }}
              aria-invalid={errors.id ? true : undefined}
              aria-describedby={errors.id ? "field-id-error" : undefined}
            />
            {errors.id && (
              <p id="field-id-error" role="alert" className="text-sm font-semibold text-danger">
                {errors.id}
              </p>
            )}
          </div>
        </details>
      )}

      {!admin && mode === "view" && <p className="text-sm text-ink-2">Read-only. You can view this rubric but not change it.</p>}

      {(errorEntries.length > 0 || state.message) && (
        <div ref={summaryRef} tabIndex={-1} role="alert" className="rounded-[10px] border-2 border-danger px-4 py-3">
          <p className="font-semibold text-danger">Please fix these, then save again:</p>
          <ul className="list-disc pl-5 text-sm">
            {state.message && <li>{state.message}</li>}
            {errorEntries.map(([k, m]) => (
              <li key={k}>{m}</li>
            ))}
          </ul>
        </div>
      )}
      {errors.acknowledged && (
        <p role="alert" className="text-sm font-semibold text-danger">
          {errors.acknowledged}
        </p>
      )}

      {editing && (
        <p role="note" className="rounded-[10px] border-2 border-surface-border bg-surface px-4 py-3 text-sm">
          {mode === "create"
            ? "You are creating a draft. It is not live until you approve it."
            : liveVersion !== null
              ? `You are editing a draft. Version ${liveVersion} stays live until you approve.`
              : "You are editing a draft. It is not live until you approve."}
        </p>
      )}

      <div className="grid gap-4 min-[900px]:grid-cols-[minmax(0,1fr)_260px] min-[900px]:gap-x-6">
        <aside aria-label="Details" className="min-[900px]:sticky min-[900px]:top-6 min-[900px]:col-start-2 min-[900px]:row-start-1 min-[900px]:self-start">
          {props.detailsSlot}
        </aside>

        <div className="flex min-w-0 flex-col gap-4 min-[900px]:col-start-1 min-[900px]:row-start-1">
          {textBlock("overview", "What the learner does", LIMITS.overview)}
          {textBlock("requirements", "What earns a 3", LIMITS.requirements)}
          {textBlock("stretchGoal", "What earns a 4", LIMITS.stretchGoal)}

          <AppCard
            title="Band descriptions"
            action={
              canEdit && !bandsOpen ? (
                <Button type="button" variant="outline" size="sm" onClick={() => openBlocks(["bands"])}>
                  Edit<span className="sr-only"> band descriptions</span>
                </Button>
              ) : undefined
            }
            helper={usesGeneric ? "This assignment uses the generic policy bands." : undefined}
          >
            {bandsOpen ? (
              <>
                {errors.bandDescriptions && (
                  <p role="alert" className="text-sm font-semibold text-danger">
                    {errors.bandDescriptions}
                  </p>
                )}
                <ol className="flex flex-col gap-4">
                  {values.bands.map((b, i) => {
                    const fid = `field-band-${i}`;
                    const err = errors[`bandDescriptions.${i}`];
                    return (
                      <li key={i} className="flex items-start gap-3">
                        <span aria-hidden="true" className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-primary text-sm font-semibold text-brand-secondary dark:bg-brand-secondary dark:text-brand-primary">
                          {i}
                        </span>
                        <div className="flex min-w-0 flex-1 flex-col gap-1">
                          <label htmlFor={fid} className="font-medium">
                            Band {i}
                          </label>
                          <AutoTextarea
                            id={fid}
                            value={b}
                            onChange={(v) => set("bands", values.bands.map((x, j) => (j === i ? v : x)))}
                            minRows={2}
                            placeholder={genericBands[i]}
                            aria-invalid={err ? true : undefined}
                            aria-describedby={`${fid}-count`}
                          />
                          {counter(b.trim().length, LIMITS.band, `${fid}-count`)}
                          {err && (
                            <p role="alert" className="text-sm font-semibold text-danger">
                              {err}
                            </p>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ol>
                {usesGeneric && <p className="text-sm">All five are empty, so the generic policy bands will apply.</p>}
                {warningPanel("bands")}
                {blockFooter("bands")}
              </>
            ) : (
              <ol className="flex flex-col gap-3">
                {shownBands.map((b, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-primary text-sm font-semibold text-brand-secondary dark:bg-brand-secondary dark:text-brand-primary">
                      <span className="sr-only">Band </span>
                      {i}
                    </span>
                    <p className={`${BODY} min-w-0 flex-1 pt-0.5`}>{b}</p>
                  </li>
                ))}
              </ol>
            )}
          </AppCard>

          {props.historySlot}

          {editing && (
            <div className="purple-card sticky bottom-4 z-20 flex flex-wrap items-center gap-3 rounded-[14px] px-4 py-3">
              <p className="min-w-0 flex-1 text-sm text-purple-body" role="status">
                {open.size} block{open.size === 1 ? "" : "s"} open{dirty ? ", unsaved changes" : ""}
              </p>
              {needsAck && (
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} className="size-5 accent-brand-secondary" />
                  I have read the warning
                </label>
              )}
              <Button type="button" variant="outline" size="sm" className={ON_PURPLE_SECONDARY} onClick={cancelAll}>
                Cancel
              </Button>
              <Button type="button" size="sm" className={ON_PURPLE_PRIMARY} onClick={save} disabled={pending}>
                {pending ? "Saving..." : mode === "create" ? "Create draft" : "Save draft"}
              </Button>
            </div>
          )}
        </div>
      </div>
      {mode === "create" && (
        <p className="text-sm">
          <Link href="/admin/rubrics/import" className="underline">
            Paste JSON instead
          </Link>
        </p>
      )}
    </>
  );
}
