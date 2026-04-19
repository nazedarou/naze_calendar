export const STAGE_LABELS = [
  "Stage 1 — Design Fee",
  "Stage 2 — Commence Work",
  "Stage 3 — Carpentry Measurement",
  "Stage 4 — Carpentry Installation",
  "Stage 5 — Project Complete",
] as const;

// Stage 1 is user-entered. Stages 2-5 are fixed % of (total − stage 1).
export const STAGE_PERCENTAGES = [null, 0.50, 0.35, 0.10, 0.05] as const;
