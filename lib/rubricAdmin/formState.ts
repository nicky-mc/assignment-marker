import type { RubricWarning } from "./validate";

export interface FormState {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string>;
  warnings?: RubricWarning[];
  /** Needs the "I have read this" tick before a flagged draft is saved. */
  needsAcknowledgement?: boolean;
  /** The values the admin typed, so the form can be shown again with them. */
  values?: Record<string, string>;
}

export const EMPTY_STATE: FormState = {};
