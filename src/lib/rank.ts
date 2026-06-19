import type { RankFactors } from "./types";

// ── Transparent ranking. NO learned weights, NO opaque "winnability score" — that
// is the generic-score trap wearing an evidence costume. We multiply named,
// inspectable factors and surface every one in the UI ("why ranked"). We anchor
// on the CONSERVATIVE end of the GM band so a play earns its rank on the number
// the AM is most likely to believe.

export function computeRank(args: {
  conservative_gm: number;
  match_confidence: number;
  coverage_confidence: number;
  freshness: number;
  corroboration: number;
  urgency_boost: number;
}): RankFactors {
  const score =
    (args.conservative_gm / 1000) *
    args.match_confidence *
    args.coverage_confidence *
    args.freshness *
    args.corroboration *
    (1 + args.urgency_boost);
  return {
    conservative_gm: args.conservative_gm,
    match_confidence: round2(args.match_confidence),
    coverage_confidence: round2(args.coverage_confidence),
    freshness: round2(args.freshness),
    corroboration: round2(args.corroboration),
    urgency_boost: round2(args.urgency_boost),
    score: Math.round(score * 100) / 100,
  };
}

// Fresher postings rank higher; decays from 1.0 (today) toward 0.8 at the 45-day edge.
export function freshnessFactor(ageDays: number): number {
  const f = 1 - Math.min(ageDays, 45) / 45 * 0.2;
  return Math.max(0.8, Math.min(1, f));
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
