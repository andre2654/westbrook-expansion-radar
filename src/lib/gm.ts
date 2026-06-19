import type { Account, GmBand } from "./types";
import { normalizeRole } from "./normalize";

// ── Gross-margin estimate, GROUNDED. Never a list rate, never an invented
// multiplier, never a flat 1,800h FTE assumption. Every input is Westbrook's OWN
// realized trailing history for THIS client + role-family. Output is a BAND
// (conservative / expected / stretch), not a hero number, plus a separately
// labeled annualized run-rate. The visible math is what makes an AM believe it.

const FULL_YEAR_HOURS = 2080;

function weighted(placements: Account["placements"], pick: (p: Account["placements"][number]) => number): number {
  const totalHeads = placements.reduce((s, p) => s + p.headcount, 0);
  if (totalHeads === 0) return 0;
  return placements.reduce((s, p) => s + pick(p) * p.headcount, 0) / totalHeads;
}

export function computeGmBand(
  account: Account,
  roleCanonical: string,
  openReqs: number,
  metroIsNew: boolean
): GmBand {
  let anchors = account.placements.filter((p) => normalizeRole(p.title_raw).canonical === roleCanonical);
  if (anchors.length === 0) anchors = account.placements; // directional fallback

  const realized_spread = round2(weighted(anchors, (p) => p.bill_rate - p.pay_rate));
  const realized_fill = round2(weighted(anchors, (p) => p.fill_rate));
  const realized_hours = Math.round(weighted(anchors, (p) => p.avg_assignment_hours));
  const cold_geo_haircut = metroIsNew ? 0.6 : 1.0;

  const expected_heads = clamp(Math.round(openReqs * realized_fill * cold_geo_haircut), 0, openReqs);
  const conservative_heads = clamp(Math.round(expected_heads * 0.65), 1, openReqs);
  const stretch_heads = clamp(Math.round(expected_heads * 1.4), expected_heads, openReqs);

  const gm = (heads: number) => Math.round(heads * realized_spread * realized_hours);

  return {
    conservative_heads,
    expected_heads,
    stretch_heads,
    conservative: gm(conservative_heads),
    expected: gm(expected_heads),
    stretch: gm(stretch_heads),
    annualized_run_rate: Math.round(expected_heads * realized_spread * FULL_YEAR_HOURS),
    inputs: {
      open_reqs: openReqs,
      realized_spread,
      realized_fill,
      realized_hours,
      cold_geo_haircut,
      anchor_placement_ids: anchors.map((p) => p.placement_id),
    },
    math_note:
      `${openReqs} open reqs × ${(realized_fill * 100).toFixed(0)}% our realized fill` +
      (metroIsNew ? ` × ${cold_geo_haircut} cold-geo haircut` : "") +
      ` ≈ ${expected_heads} winnable heads × $${realized_spread.toFixed(2)}/hr spread × ${realized_hours}h/assignment.`,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}
