import {
  loadAccounts,
  loadSignals,
  loadFlags,
  loadAlsoSurfaced,
} from "./data";
import { normalizeRole, normalizeMetro } from "./normalize";
import { resolveAccount } from "./resolve";
import { gapDetect } from "./gap";
import { suppress } from "./suppress";
import { computeGmBand } from "./gm";
import { computeRank, freshnessFactor } from "./rank";
import { draftOpener } from "./llm";
import type {
  Account,
  ExternalSignal,
  EvidenceItem,
  Play,
  HeldItem,
  DroppedItem,
  RadarResult,
} from "./types";

// In production this is the scheduled run date. Held constant here so the
// generated radar is deterministic for the demo (no live-API roulette).
const RUN_DATE = "2026-06-19";
const RUN_WEEK = "2026-06-19";

function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((new Date(toIso).getTime() - new Date(fromIso).getTime()) / 86400000);
}

export async function runRadar(): Promise<RadarResult> {
  const accounts = loadAccounts();
  const signals = loadSignals();
  const flags = loadFlags();
  const alsoRows = loadAlsoSurfaced();
  const byId = new Map<string, Account>(accounts.map((a) => [a.account_id, a]));

  // ── Corroboration pass: index DC/office openings by account+metro so a job
  // posting in the same place gets an evidence boost (and a stronger opener).
  const corroboration = new Map<string, ExternalSignal>();
  for (const s of signals) {
    if (s.type !== "dc_opening") continue;
    const m = resolveAccount(s.employer_name_raw, accounts);
    if (!m.account_id) continue;
    const metro = normalizeMetro(s.location_raw).canonical;
    corroboration.set(`${m.account_id}|${metro}`, s);
  }

  const plays: Play[] = [];
  const held: HeldItem[] = [];
  const dropped: DroppedItem[] = [];
  let openerSource: "llm" | "template" = "template";

  for (const sig of signals) {
    if (sig.type === "dc_opening") continue; // used only as corroboration
    if (sig.type === "news_macro") {
      dropped.push({ signal_id: sig.signal_id, account_id: null, account_name: "—", reason: "Not client-specific", detail: `Macro/news signal ("${sig.title_raw}") with no employer to attach to.` });
      continue;
    }

    const match = resolveAccount(sig.employer_name_raw, accounts);
    if (!match.account_id) {
      dropped.push({ signal_id: sig.signal_id, account_id: null, account_name: sig.employer_name_raw || "—", reason: "No account match (closed-world)", detail: match.reason });
      continue;
    }
    const account = byId.get(match.account_id)!;

    const gap = gapDetect(account, sig, RUN_DATE);
    if (!gap.candidate) {
      dropped.push({ signal_id: sig.signal_id, account_id: account.account_id, account_name: account.display_name, reason: gap.reason, detail: gap.detail });
      continue;
    }

    const supp = suppress(account, gap.role.canonical, flags);
    if (supp.held) {
      held.push({ signal_id: sig.signal_id, account_id: account.account_id, account_name: account.display_name, am: account.am, role_label: gap.role.label, metro_label: gap.metro.label, reason: supp.reason, kind: supp.kind, needs_confirm: supp.needs_confirm });
      continue;
    }

    // ── Build the evidenced play ──
    const gm = computeGmBand(account, gap.role.canonical, sig.open_reqs, gap.metro_is_new);
    const age = daysBetween(sig.posted_date, RUN_DATE);
    const corr = corroboration.get(`${account.account_id}|${gap.metro.canonical}`);

    const evidence: EvidenceItem[] = [];
    evidence.push({ kind: "external", label: `${sig.open_reqs} ${gap.role.label} reqs in ${gap.metro.label}`, detail: `${sig.provenance.replace("_", "-")}, posted ${sig.posted_date}`, url: sig.url, url_status: sig.url_status, source_id: sig.signal_id });
    if (corr) evidence.push({ kind: "external", label: `Catalyst: new DC announced in ${gap.metro.label}`, detail: `Corroborating signal, ${corr.posted_date}`, url: corr.url, url_status: corr.url_status, source_id: corr.signal_id });
    for (const pid of gm.inputs.anchor_placement_ids) {
      const p = account.placements.find((x) => x.placement_id === pid);
      if (!p) continue;
      const metroLabel = normalizeMetro(p.location_raw).label;
      evidence.push({ kind: "internal", label: `${p.headcount}× ${normalizeRole(p.title_raw).label} in ${metroLabel}`, detail: `${(p.fill_rate * 100).toFixed(0)}% fill · $${(p.bill_rate - p.pay_rate).toFixed(2)}/hr realized spread · ~${p.avg_assignment_hours}h/assignment`, source_id: p.placement_id });
    }

    // Grounding gate: a play must trace to a live external citation AND our own
    // placement rows AND real GM inputs — otherwise drop it. No citation, no play.
    const hasExternal = evidence.some((e) => e.kind === "external" && !!e.url);
    const hasInternal = evidence.some((e) => e.kind === "internal");
    if (!hasExternal || !hasInternal || gm.inputs.anchor_placement_ids.length === 0) {
      dropped.push({ signal_id: sig.signal_id, account_id: account.account_id, account_name: account.display_name, reason: "Failed grounding gate", detail: "Missing a live citation or internal anchor — not shown to the AM." });
      continue;
    }

    const rank = computeRank({
      conservative_gm: gm.conservative,
      match_confidence: match.confidence,
      coverage_confidence: gap.coverage_confidence,
      freshness: freshnessFactor(age),
      corroboration: corr ? 1.15 : 1.0,
      urgency_boost: 0,
    });

    const opener = await draftOpener({
      am: account.am,
      client: account.display_name,
      our_metro: anchorMetro(account, gm.inputs.anchor_placement_ids),
      our_role: gap.role.label,
      our_headcount: account.placements.filter((p) => normalizeRole(p.title_raw).canonical === gap.role.canonical).reduce((s, p) => s + p.headcount, 0),
      our_fill_pct: Math.round(gm.inputs.realized_fill * 100),
      their_metro: gap.metro.label,
      their_open_reqs: sig.open_reqs,
      their_role: gap.role.label,
      catalyst: corr ? `announced a new ${gap.metro.label} DC` : `is hiring in ${gap.metro.label}`,
    });
    if (opener.source === "llm") openerSource = "llm";

    plays.push({
      id: `play_${sig.signal_id}`,
      account_id: account.account_id,
      account_name: account.display_name,
      am: account.am,
      am_is_skeptic: account.am_is_skeptic,
      archetype: "geographic_whitespace",
      headline: `${account.display_name} — ${gap.role.label} whitespace in ${gap.metro.label}`,
      role_label: gap.role.label,
      role_canonical: gap.role.canonical,
      metro_label: gap.metro.label,
      metro_canonical: gap.metro.canonical,
      metro_is_new: gap.metro_is_new,
      open_reqs: sig.open_reqs,
      match_confidence: match.confidence,
      coverage_confidence: gap.coverage_confidence,
      gm,
      rank,
      evidence,
      suggested_move: `Warm intro from ${account.am} (${anchorMetro(account, gm.inputs.anchor_placement_ids)}) to the ${gap.metro.label} ops contact; lead with our existing track record, confirm the roles are open to us, then scope a first crew.`,
      draft_opener: opener.text,
      opener_source: opener.source,
      is_new_this_week: sig.first_seen_week === RUN_WEEK,
    });
  }

  plays.sort((a, b) => b.rank.score - a.rank.score);

  // ── Foundation metric: how clean is the join? Fraction of role+metro
  // normalizations (internal + external) we auto-resolved at high confidence,
  // and what got routed to human verification. On real ATS data this is the gate
  // we'd publish in week 1 before generating any plays.
  const confs: { conf: number; label: string }[] = [];
  for (const a of accounts) {
    for (const p of a.placements) {
      confs.push({ conf: normalizeRole(p.title_raw).confidence, label: `${a.display_name}: role "${p.title_raw}"` });
      confs.push({ conf: normalizeMetro(p.location_raw).confidence, label: `${a.display_name}: location "${p.location_raw}"` });
    }
  }
  for (const s of signals) {
    if (s.type === "news_macro") continue;
    // DC/office openings carry no meaningful role title — only score their metro.
    if (s.type === "job_posting") confs.push({ conf: normalizeRole(s.title_raw).confidence, label: `signal: role "${s.title_raw}"` });
    confs.push({ conf: normalizeMetro(s.location_raw).confidence, label: `signal: location "${s.location_raw}"` });
  }
  const clean = confs.filter((c) => c.conf >= 0.85).length;
  const needs = confs.filter((c) => c.conf < 0.7);

  const alsoSurfaced = alsoRows.map((r) => {
    const acc = byId.get(r.account_id);
    return { ...r, account_name: acc?.display_name ?? r.account_id, am: acc?.am ?? "—" };
  });

  return {
    run_week: RUN_WEEK,
    generated_at: new Date().toISOString(),
    plays,
    also_surfaced: alsoSurfaced,
    held,
    dropped,
    meta: {
      accounts_scanned: accounts.length,
      signals_scanned: signals.length,
      resolution_rate: Math.round((clean / confs.length) * 1000) / 1000,
      needs_verification: needs.length,
      needs_verification_examples: needs.slice(0, 3).map((n) => n.label),
      total_conservative_gm: plays.reduce((s, p) => s + p.gm.conservative, 0),
      total_expected_gm: plays.reduce((s, p) => s + p.gm.expected, 0),
      opener_source: openerSource,
    },
  };
}

function anchorMetro(account: Account, anchorIds: string[]): string {
  const first = account.placements.find((p) => anchorIds.includes(p.placement_id));
  return first ? normalizeMetro(first.location_raw).label : "our home market";
}
