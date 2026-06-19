import type { Account, MatchResult } from "./types";

// ── Entity resolution, CLOSED-WORLD. We only ever match an external signal to
// one of the pinned pilot accounts. This is the single most important safety
// choice: open-world matching risks a false merge that pitches into the wrong
// (possibly MSP-locked) client. Below the confidence floor we return no match
// rather than guess.

const FLOOR = 0.6;

function normName(s: string): string {
  return s
    .toLowerCase()
    .replace(/[.,]/g, " ")
    .replace(/\b(inc|llc|co|corp|company|group|systems?|incorporated)\b/g, " ")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenOverlap(a: string, b: string): number {
  const ta = new Set(a.split(" ").filter(Boolean));
  const tb = new Set(b.split(" ").filter(Boolean));
  if (ta.size === 0 || tb.size === 0) return 0;
  let inter = 0;
  for (const t of ta) if (tb.has(t)) inter++;
  return inter / Math.max(ta.size, tb.size);
}

export function resolveAccount(employerRaw: string, accounts: Account[]): MatchResult {
  const target = normName(employerRaw);
  if (!target) return { account_id: null, confidence: 0, reason: "empty employer name" };

  let best: { id: string; conf: number; reason: string } | null = null;
  for (const acc of accounts) {
    for (const variant of acc.client_names_raw) {
      const nv = normName(variant);
      let conf = 0;
      let reason = "";
      if (nv === target) {
        conf = 0.98;
        reason = `exact name match ("${variant}")`;
      } else {
        const ov = tokenOverlap(nv, target);
        conf = ov >= 1 ? 0.95 : ov * 0.9;
        reason = `token overlap ${(ov * 100).toFixed(0)}% with "${variant}"`;
      }
      if (!best || conf > best.conf) best = { id: acc.account_id, conf, reason };
    }
  }

  if (!best || best.conf < FLOOR) {
    return {
      account_id: null,
      confidence: best ? best.conf : 0,
      reason: best
        ? `below confidence floor (${best.conf.toFixed(2)} < ${FLOOR}) — held, not guessed`
        : "no candidate",
    };
  }
  return { account_id: best.id, confidence: Math.min(best.conf, 0.99), reason: best.reason };
}
