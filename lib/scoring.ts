export interface ScoreBand {
  mark: number;
  borderline: boolean;
  /** True only when the cap lowered the mark that rounding would otherwise have given. */
  capped: boolean;
}

/** The two fields of a presenceEvidence item that the cap depends on. */
export interface PresenceItem {
  level: "required" | "stretch";
  met: boolean;
}

const REQUIRED_ELEMENT_CAP = 2;

/**
 * Rounds a decimal AI-assigned score (0-4, e.g. 2.6) to a whole mark.
 *
 * Scores close to the midpoint between two bands (fractional part 0.4-0.6)
 * are flagged borderline, per the marking policy's second-marking guidance.
 *
 * Testing (see testing/boundary-*.md, six rounds) found the model can write
 * explicit boundary-case reasoning in its explanation text while still
 * outputting a confident, non-borderline decimal (e.g. reasoning "sits
 * between band 1 and 2" but scoring 1.8, outside the 1.4-1.6 window). The
 * marking prompt now asks the model to decide boundaryCase directly as part
 * of that same reasoning (see lib/marking.ts), so `modelFlaggedBoundary` is
 * the primary signal here. The fraction-window check is kept as a fallback:
 * it still catches genuinely boundary-scored submissions even if the model's
 * explicit flag is ever wrong or omitted, rather than removing a working
 * safety net on the strength of one fix.
 *
 * The cap is derived here from the evidence list, not trusted from the model.
 * Testing showed the model could flag a required element as missing and still
 * set its own ceilingBand to 4, or state a ceiling in prose and then output a
 * boundary score that rounds back up past it. So: if any presenceEvidence item
 * is level "required" and not met, the mark is capped at 2. The model's
 * ceilingBand can only lower that cap (to 0 or 1); a ceilingBand of 3 or more is
 * ignored, and ceilingBand alone never caps. A stretch-only shortfall never caps,
 * and with no evidence there is no cap. The cap applies after rounding, so
 * rounding is unchanged whenever it does not bind (3.5 with only a stretch
 * element missing still rounds up to 4).
 */
export function computeBand(
  rawScore: number,
  modelFlaggedBoundary = false,
  ceilingBand = 4,
  presenceEvidence?: readonly PresenceItem[] | null,
): ScoreBand {
  const clamped = Math.min(4, Math.max(0, rawScore));
  const rounded = Math.round(clamped);
  const requiredMissing = (presenceEvidence ?? []).some((p) => p.level === "required" && !p.met);
  const modelCap = ceilingBand < 3 ? ceilingBand : REQUIRED_ELEMENT_CAP;
  const effectiveCap = requiredMissing ? Math.min(REQUIRED_ELEMENT_CAP, modelCap) : 4;
  const mark = Math.min(rounded, effectiveCap);
  const capped = mark < rounded;
  // Round to 1dp before comparing to avoid float noise (e.g. 2.4 - 2 !== 0.4).
  const fraction = Math.round((clamped - Math.floor(clamped)) * 10) / 10;
  const fractionIndicatesBoundary = fraction >= 0.4 && fraction <= 0.6;
  const borderline = modelFlaggedBoundary || fractionIndicatesBoundary;
  return { mark, borderline, capped };
}
