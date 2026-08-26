// Centralized input-validation limits, applied consistently across every
// create/edit form and editable table cell in the app. Keeping the numbers
// in one place means every "how big can this get" decision is made once.

// Short single-line fields: names, codes, titles, department labels.
export const TEXT_SHORT_MAX = 100;
// Medium single-line fields: SLA rule/value text, action descriptions.
export const TEXT_MEDIUM_MAX = 200;
// Multi-line fields: notes, comments, free-text descriptions.
export const TEXT_LONG_MAX = 1000;
// Search boxes — generous, just a safety cap, not a UX constraint.
export const SEARCH_MAX = 200;

// Monetary amounts (collection amounts, dispute amounts, etc.).
export const AMOUNT_MAX = 100_000_000;
// Day-count fields (e.g. payment term "Number of Days").
export const DAYS_MAX = 3650;
// Percentage-style numeric fields (e.g. Collection Plan's target %).
export const PERCENT_MAX = 1000;

/** Clamp a raw number-input string into [min, max], defaulting to `fallback` when blank/invalid. */
export function clampNumber(raw: string, max: number, min = 0, fallback = 0): number {
  if (raw.trim() === '') return fallback;
  const n = Number(raw);
  if (isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}
