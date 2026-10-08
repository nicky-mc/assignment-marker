import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown, CircleHelp, EyeOff, ListChecks, MessageSquareQuote, ShieldCheck } from "lucide-react";
import PageShell from "@/components/PageShell";
import { HeroCard } from "@/components/HeroCard";
import { buttonVariants } from "@/components/ui/button";
import ExampleResult from "@/components/howto/ExampleResult";
import { AddIllustration, MarkIllustration, NamesIllustration, PickIllustration, ResultIllustration } from "@/components/howto/Illustrations";
import { ANONYMISING, HOW_TO } from "@/content/how-to";
import BeforeAfter from "@/components/howto/BeforeAfter";
import { requirePageAccess } from "@/lib/auth/pageAccess";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "How to use AssisTED" };

const ILLUSTRATIONS = [PickIllustration, AddIllustration, NamesIllustration, MarkIllustration, ResultIllustration];
const GOOD_TO_KNOW_ICONS = [MessageSquareQuote, ListChecks, EyeOff, ShieldCheck, CircleHelp];
const ON_PURPLE_PRIMARY = "border-brand-secondary bg-brand-secondary text-brand-primary hover:bg-brand-secondary/90";

// Gentle entrance: each block rises a little as it appears. Switched off for reduced motion (see app/globals.css).
const rise = (i: number) => ({ style: { "--rise-delay": `${Math.min(i, 8) * 70}ms` } as React.CSSProperties, className: "how-to-rise" });

const CARD = "rounded-[14px] border-2 border-surface-border bg-surface p-5 text-ink";

function SectionHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="mt-4 font-heading text-2xl font-semibold text-ink">
      {children}
    </h2>
  );
}

export default async function HowToPage() {
  await requirePageAccess();
  const L = HOW_TO.labels;

  return (
    <PageShell width="wide" className="gap-6">
      <div {...rise(0)}>
        <HeroCard
          title={HOW_TO.title}
          actions={
            <Link href="/" className={cn(buttonVariants({ size: "lg" }), ON_PURPLE_PRIMARY)}>
              {L.start}
            </Link>
          }
        >
          <span className="block text-lg font-medium text-purple-title">{HOW_TO.subtitle}</span>
          <span className="mt-2 block max-w-[70ch]">{HOW_TO.intro}</span>
        </HeroCard>
      </div>

      <section aria-labelledby="steps-heading" className="flex flex-col gap-4">
        <SectionHeading id="steps-heading">{L.stepsHeading}</SectionHeading>
        <ol className="flex flex-col gap-4">
          {HOW_TO.steps.map((step, i) => {
            const Art = ILLUSTRATIONS[i];
            return (
              <li key={step.title} {...rise(i + 1)}>
                <article className={cn(CARD, "grid items-center gap-4 min-[640px]:grid-cols-[minmax(0,1fr)_11rem] min-[640px]:gap-6", i % 2 === 1 && "min-[640px]:grid-cols-[11rem_minmax(0,1fr)]")}>
                  <div className={cn("flex flex-col gap-2", i % 2 === 1 && "min-[640px]:order-2")}>
                    <div className="flex items-center gap-3">
                      <span
                        aria-hidden="true"
                        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-primary font-heading text-base font-semibold text-brand-secondary dark:bg-brand-secondary dark:text-brand-primary"
                      >
                        {i + 1}
                      </span>
                      <h3 className="font-heading text-xl font-semibold">
                        <span className="sr-only">Step {i + 1}: </span>
                        {step.title}
                      </h3>
                    </div>
                    <p className="max-w-[60ch] text-base">{step.body}</p>
                    {"note" in step && step.note && <p className="max-w-[60ch] text-base font-medium">{step.note}</p>}
                  </div>
                  <div className={cn("flex justify-center", i % 2 === 1 && "min-[640px]:order-1")}>
                    <Art />
                  </div>
                </article>
              </li>
            );
          })}
        </ol>
      </section>

      <section aria-labelledby="anon-heading" className="flex flex-col gap-4">
        <SectionHeading id="anon-heading">{L.anonymiseHeading}</SectionHeading>
        <p className="max-w-[70ch]">{ANONYMISING.intro}</p>
        <BeforeAfter />

        <div className="grid gap-4 min-[760px]:grid-cols-2">
          <article className={CARD}>
            <h3 className="font-heading text-lg font-semibold">{ANONYMISING.caughtHeading}</h3>
            <ul className="mt-2 flex flex-col gap-2">
              {ANONYMISING.caught.map((c) => (
                <li key={c.what} className="flex flex-col gap-1 text-base">
                  <span>{c.what}</span>
                  <span className="w-fit rounded border border-surface-border bg-muted px-1 text-[12px] leading-5 font-medium text-ink-2">
                    <span className="sr-only">Replaced with </span>
                    {c.placeholder}
                  </span>
                </li>
              ))}
            </ul>
          </article>
          <article className={CARD}>
            <h3 className="font-heading text-lg font-semibold">{ANONYMISING.missedHeading}</h3>
            <ul className="mt-2 flex list-disc flex-col gap-2 pl-5 text-base">
              {ANONYMISING.missedList.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </article>
        </div>

        <article className={CARD}>
          <h3 className="font-heading text-lg font-semibold">{ANONYMISING.stepsHeading}</h3>
          <ol className="mt-2 flex flex-col gap-3">
            {ANONYMISING.steps.map((step, i) => (
              <li key={step} className="flex items-start gap-3">
                <span aria-hidden="true" className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-primary font-heading text-sm font-semibold text-brand-secondary dark:bg-brand-secondary dark:text-brand-primary">
                  {i + 1}
                </span>
                <p className="max-w-[65ch] text-base">
                  <span className="sr-only">Step {i + 1}: </span>
                  {step}
                </p>
              </li>
            ))}
          </ol>
        </article>

        <aside aria-labelledby="why-heading" className="purple-card rounded-[14px] p-5">
          <h3 id="why-heading" className="font-heading text-xl font-semibold text-purple-title">
            {ANONYMISING.whyHeading}
          </h3>
          <ul className="mt-3 flex list-disc flex-col gap-2 pl-5 text-base">
            {ANONYMISING.why.map((w) => (
              <li key={w} className="max-w-[70ch]">
                {w}
              </li>
            ))}
          </ul>
        </aside>
      </section>

      <section aria-labelledby="know-heading" className="flex flex-col gap-4">
        <SectionHeading id="know-heading">{L.goodToKnowHeading}</SectionHeading>
        <ul className="grid gap-4 min-[700px]:grid-cols-2">
          {HOW_TO.goodToKnow.map((item, i) => {
            const Icon = GOOD_TO_KNOW_ICONS[i];
            return (
              <li key={item.title} {...rise(i)}>
                <article className={cn(CARD, "flex h-full gap-3")}>
                  <span aria-hidden="true" className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-brand-primary text-brand-secondary dark:bg-brand-secondary dark:text-brand-primary">
                    <Icon className="size-5" />
                  </span>
                  <div className="flex min-w-0 flex-col gap-1">
                    <h3 className="font-heading text-lg font-semibold">{item.title}</h3>
                    <p className="text-base">{item.body}</p>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="example-heading" className="flex flex-col gap-4">
        <SectionHeading id="example-heading">{L.exampleHeading}</SectionHeading>
        <p className="max-w-[70ch]">{L.exampleIntro}</p>
        <div className="flex flex-col gap-4 rounded-[14px] border-2 border-dashed border-surface-border p-3 min-[640px]:p-4">
          <p className="inline-flex w-fit items-center gap-2 rounded-full border-2 border-surface-border bg-surface px-3 py-1 text-sm font-semibold text-ink">
            <span aria-hidden="true">✎</span>
            {L.exampleBadge}
          </p>
          <ExampleResult />
        </div>
      </section>

      <section aria-labelledby="faq-heading" className="flex flex-col gap-4">
        <SectionHeading id="faq-heading">{L.faqHeading}</SectionHeading>
        <div className="flex flex-col gap-3">
          {HOW_TO.faq.map((f) => (
            <details key={f.q} className={cn(CARD, "group py-0")}>
              <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 rounded-[10px] py-3 font-heading text-lg font-semibold marker:hidden [&::-webkit-details-marker]:hidden">
                <span className="min-w-0 flex-1">{f.q}</span>
                <ChevronDown aria-hidden="true" className="size-5 shrink-0 transition-transform duration-150 group-open:rotate-180 motion-reduce:transition-none" />
              </summary>
              <p className="max-w-[70ch] pb-4 text-base">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section aria-labelledby="bottom-heading" className="purple-card flex flex-col items-start gap-3 rounded-[14px] p-5">
        <h2 id="bottom-heading" className="font-heading text-2xl font-semibold text-purple-title">
          {L.bottomHeading}
        </h2>
        <Link href="/" className={cn(buttonVariants({ size: "lg" }), ON_PURPLE_PRIMARY)}>
          {L.start}
        </Link>
      </section>
    </PageShell>
  );
}
