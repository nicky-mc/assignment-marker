export interface ScoreBand {
  mark: number;
  borderline: boolean;
}

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
 */
export function computeBand(rawScore: number, modelFlaggedBoundary = false): ScoreBand {
  const clamped = Math.min(4, Math.max(0, rawScore));
  const mark = Math.round(clamped);
  // Round to 1dp before comparing to avoid float noise (e.g. 2.4 - 2 !== 0.4).
  const fraction = Math.round((clamped - Math.floor(clamped)) * 10) / 10;
  const fractionIndicatesBoundary = fraction >= 0.4 && fraction <= 0.6;
  const borderline = modelFlaggedBoundary || fractionIndicatesBoundary;
  return { mark, borderline };
}
