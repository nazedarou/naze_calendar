import { addMonths } from "date-fns";

// Split a total into 4 milestone amounts (rounded to cents).
export function defaultSplit(total: number): number[] {
  if (!Number.isFinite(total) || total <= 0) return [0, 0, 0, 0];
  const cents = Math.round(total * 100);
  const base = Math.floor(cents / 4);
  const rem = cents - base * 4;
  return [0, 1, 2, 3].map((i) => (base + (i < rem ? 1 : 0)) / 100);
}

// Default due dates spaced ~1 month apart starting from `start`.
export function defaultDueDates(start: Date): Date[] {
  return [0, 1, 2, 3].map((i) => addMonths(start, i));
}
