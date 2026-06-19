import type { Play } from "./types";

export interface Trait {
  label: string;
  value: number; // 0..1 for the polygon
  display: string; // shown to the user
}

// Map a play's REAL ranking inputs onto 6 scouting-style "traits". Nothing here
// is invented — each axis is a factor the radar actually uses, so the hexagon is
// an honest fingerprint of why the play ranks where it does.
export function playTraits(p: Play): Trait[] {
  const corr = p.rank.corroboration > 1 ? 1 : 0.5;
  const gmSize = Math.min(1, p.gm.conservative / 80000); // 80K ≈ a strong weekly play
  const win = p.gm.inputs.realized_fill;
  const pct = (n: number) => `${Math.round(n * 100)}%`;
  return [
    { label: "Match", value: p.match_confidence, display: pct(p.match_confidence) },
    { label: "Coverage", value: p.coverage_confidence, display: pct(p.coverage_confidence) },
    { label: "Freshness", value: p.rank.freshness, display: pct(p.rank.freshness) },
    { label: "Corroboration", value: corr, display: corr === 1 ? "2 sources" : "1 source" },
    { label: "GM size", value: gmSize, display: pct(gmSize) },
    { label: "Win rate", value: win, display: pct(win) },
  ];
}
