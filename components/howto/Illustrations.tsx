// Small original illustrations for the five steps. Decorative (hidden from screen readers), drawn with the design
// tokens so they follow light and dark mode. No stock images.
const BASE = "h-auto w-full max-w-44";

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 160 110" aria-hidden="true" focusable="false" className={BASE}>
      {children}
    </svg>
  );
}

const INK = "stroke-ink";
const SURF = "fill-surface";
const FIELD = "fill-field";
const GREEN = "fill-brand-secondary";
const PURPLE = "fill-brand-primary dark:fill-brand-secondary";

// 1. Pick the assignment: two drop-down fields and a tick.
export function PickIllustration() {
  return (
    <Frame>
      <rect x="14" y="14" width="132" height="82" rx="10" className={`${SURF} ${INK}`} strokeWidth="2.5" />
      <rect x="26" y="26" width="86" height="20" rx="6" className={`${FIELD} ${INK}`} strokeWidth="2" />
      <path d="M96 33l6 7 6-7" className={`${INK} fill-none`} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="26" y="56" width="108" height="20" rx="6" className={`${FIELD} ${INK}`} strokeWidth="2" />
      <path d="M118 63l6 7 6-7" className={`${INK} fill-none`} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="132" cy="30" r="12" className={`${GREEN} ${INK}`} strokeWidth="2.5" />
      <path d="M126 30l5 5 8-9" className={`${INK} fill-none`} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </Frame>
  );
}

// 2. Add the work: stacked pages with labels, and a link chain.
export function AddIllustration() {
  return (
    <Frame>
      <rect x="40" y="12" width="62" height="78" rx="6" className={`${FIELD} ${INK}`} strokeWidth="2" transform="rotate(8 71 51)" />
      <rect x="28" y="14" width="62" height="78" rx="6" className={`${SURF} ${INK}`} strokeWidth="2.5" />
      <path d="M38 34h42M38 44h42M38 54h30" className={`${INK} fill-none`} strokeWidth="2.5" strokeLinecap="round" />
      <rect x="22" y="70" width="46" height="18" rx="9" className={`${GREEN} ${INK}`} strokeWidth="2.5" />
      <path d="M32 79h26" className={`${INK} fill-none`} strokeWidth="2.5" strokeLinecap="round" />
      <rect x="98" y="46" width="34" height="16" rx="8" className={`${FIELD} ${INK}`} strokeWidth="3" transform="rotate(-35 115 54)" />
      <rect x="108" y="62" width="34" height="16" rx="8" className={`${FIELD} ${INK}`} strokeWidth="3" transform="rotate(-35 125 70)" />
    </Frame>
  );
}

// 3. Check the names: a page with some lines hidden behind bars.
export function NamesIllustration() {
  return (
    <Frame>
      <rect x="22" y="10" width="86" height="92" rx="8" className={`${SURF} ${INK}`} strokeWidth="2.5" />
      <path d="M34 28h50M34 66h62M34 78h40" className={`${INK} fill-none`} strokeWidth="2.5" strokeLinecap="round" />
      <rect x="34" y="40" width="48" height="10" rx="5" className={PURPLE} />
      <rect x="34" y="52" width="64" height="10" rx="5" className={PURPLE} />
      <circle cx="118" cy="74" r="17" className={`${FIELD} ${INK}`} strokeWidth="3" />
      <path d="M131 87l14 14" className={`${INK} fill-none`} strokeWidth="5" strokeLinecap="round" />
      <path d="M111 74l5 5 9-10" className={`${INK} fill-none`} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </Frame>
  );
}

// 4. Mark: a button, with the sections above folding away.
export function MarkIllustration() {
  return (
    <Frame>
      <rect x="22" y="12" width="116" height="14" rx="7" className={`${SURF} ${INK}`} strokeWidth="2.5" />
      <rect x="30" y="32" width="100" height="14" rx="7" className={`${SURF} ${INK}`} strokeWidth="2.5" opacity="0.75" />
      <rect x="38" y="52" width="84" height="12" rx="6" className={`${SURF} ${INK}`} strokeWidth="2.5" opacity="0.5" />
      <rect x="40" y="74" width="80" height="26" rx="10" className={`${PURPLE} ${INK}`} strokeWidth="2.5" />
      <path d="M72 80l16 7-16 7z" className={`${GREEN} stroke-brand-primary`} strokeWidth="1.5" strokeLinejoin="round" />
    </Frame>
  );
}

// 5. Read the result: a card with a quote and a pencil.
export function ResultIllustration() {
  return (
    <Frame>
      <rect x="16" y="12" width="104" height="86" rx="10" className={`${SURF} ${INK}`} strokeWidth="2.5" />
      <rect x="26" y="22" width="40" height="22" rx="8" className={`${GREEN} ${INK}`} strokeWidth="2.5" />
      <path d="M36 33l5 5 10-11" className={`${INK} fill-none`} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="26" y="54" width="4" height="26" rx="2" className={PURPLE} />
      <path d="M38 60h66M38 70h50M38 80h58" className={`${INK} fill-none`} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M118 90l6-22 14-14 14 14-14 14z" className={`${FIELD} ${INK}`} strokeWidth="2.5" strokeLinejoin="round" transform="translate(-10 -8)" />
      <path d="M128 60l10 10" className={`${INK} fill-none`} strokeWidth="2.5" />
    </Frame>
  );
}
