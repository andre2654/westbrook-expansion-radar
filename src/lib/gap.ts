import type { Account, ExternalSignal, NormResult } from "./types";
import { normalizeRole, normalizeMetro } from "./normalize";

// ── Deterministic gap detection. A job posting becomes a candidate ONLY if:
//   client matches (done upstream) + role classified + provenance employer-direct
//   + fresh (not a repost / not stale) + the role×metro is genuinely NEW to us.
// "0 placements there" is treated as whitespace ONLY because matching is
// closed-world (we hold the account's full placement list) — we still attach a
// coverage-confidence so the AM can see how sure we are.

const FRESHNESS_DAYS = 45;

function daysBetween(fromIso: string, toIso: string): number {
  const a = new Date(fromIso).getTime();
  const b = new Date(toIso).getTime();
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

export function servedSet(account: Account): Set<string> {
  const s = new Set<string>();
  for (const p of account.placements) {
    const role = normalizeRole(p.title_raw).canonical;
    const metro = normalizeMetro(p.location_raw).canonical;
    s.add(`${role}|${metro}`);
  }
  return s;
}

export function roleFamiliesServed(account: Account): Set<string> {
  return new Set(account.placements.map((p) => normalizeRole(p.title_raw).canonical));
}

export type GapResult =
  | { candidate: true; metro_is_new: boolean; coverage_confidence: number; role: NormResult; metro: NormResult }
  | { candidate: false; reason: string; detail: string; role: NormResult; metro: NormResult };

export function gapDetect(account: Account, signal: ExternalSignal, runDate: string): GapResult {
  const role = normalizeRole(signal.title_raw);
  const metro = normalizeMetro(signal.location_raw);

  if (role.canonical === "unknown") {
    return { candidate: false, reason: "Unclassified role", detail: `Could not confidently classify "${signal.title_raw}" — routed to needs-verification.`, role, metro };
  }
  if (signal.provenance !== "employer_direct") {
    return { candidate: false, reason: "Provenance not employer-direct", detail: `Source "${signal.provenance}" could be an aggregator or agency-posted (possibly us). Not pursued without employer-direct provenance.`, role, metro };
  }
  const age = daysBetween(signal.posted_date, runDate);
  if (signal.is_repost || age > FRESHNESS_DAYS) {
    return { candidate: false, reason: "Failed freshness", detail: signal.is_repost ? `Flagged as a repost/ghost req (posted ${age}d ago) — likely already filled or evergreen.` : `Posting is ${age}d old (> ${FRESHNESS_DAYS}d).`, role, metro };
  }

  const served = servedSet(account);
  if (served.has(`${role.canonical}|${metro.canonical}`)) {
    return { candidate: false, reason: "Already served", detail: `We already staff ${role.label} for this client in ${metro.label}.`, role, metro };
  }

  const knowsRole = roleFamiliesServed(account).has(role.canonical);
  // High coverage confidence when we already run this role-family for the client
  // (so we trust both the "whitespace" read and our fill estimate). Lower when
  // it's a new role-family for them (directional).
  const coverage_confidence = knowsRole ? 0.9 : 0.6;

  return { candidate: true, metro_is_new: true, coverage_confidence, role, metro };
}
