export interface ScoreBand {
  mark: number;
  borderline: boolean;
}

/**
 * Rounds a decimal AI-assigned score (0-4, e.g. 2.6) to a whole mark.
 * Scores close to the midpoint between two bands (fractional part 0.4-0.6)
 * are flagged borderline, per the marking policy's second-marking guidance.
 */
export function computeBand(rawScore: number): ScoreBand {
  const clamped = Math.min(4, Math.max(0, rawScore));
  const mark = Math.round(clamped);
  // Round to 1dp before comparing to avoid float noise (e.g. 2.4 - 2 !== 0.4).
  const fraction = Math.round((clamped - Math.floor(clamped)) * 10) / 10;
  const borderline = fraction >= 0.4 && fraction <= 0.6;
  return { mark, borderline };
}
