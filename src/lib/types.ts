// ── Domain types (shared by the engine, the run-radar script, and the UI) ──

export interface Placement {
  placement_id: string;
  title_raw: string;
  location_raw: string;
  headcount: number;
  bill_rate: number;
  pay_rate: number;
  fill_rate: number;
  avg_assignment_hours: number;
  status: string;
  end_date: string;
}

export interface Account {
  account_id: string;
  display_name: string;
  client_names_raw: string[];
  am: string;
  am_is_skeptic: boolean;
  notes: string;
  placements: Placement[];
}

export interface ExternalSignal {
  signal_id: string;
  type: "job_posting" | "dc_opening" | "news_macro";
  employer_name_raw: string;
  title_raw: string;
  location_raw: string;
  open_reqs: number;
  provenance: string;
  url: string;
  url_status?: string;
  url_note?: string;
  posted_date: string;
  is_repost: boolean;
  first_seen_week: string;
}

export interface RelationshipFlag {
  account_id: string;
  flag: string;
  owner: string;
  note: string;
  added_week: string;
}

export interface AlsoSurfacedRow {
  id: string;
  account_id: string;
  archetype: string;
  confidence: string;
  headline: string;
  rationale: string;
  gm_band: { conservative: number; expected: number; stretch: number; basis: string };
  caveat: string;
  evidence_note: string;
}

// ── Engine intermediate shapes ──

export interface NormResult {
  canonical: string;
  label: string;
  confidence: number;
  reason: string;
}

export interface MatchResult {
  account_id: string | null;
  confidence: number;
  reason: string;
}

export interface GmInputs {
  open_reqs: number;
  realized_spread: number;
  realized_fill: number;
  realized_hours: number;
  cold_geo_haircut: number;
  anchor_placement_ids: string[];
}

export interface GmBand {
  conservative_heads: number;
  expected_heads: number;
  stretch_heads: number;
  conservative: number;
  expected: number;
  stretch: number;
  annualized_run_rate: number;
  inputs: GmInputs;
  math_note: string;
}

export interface RankFactors {
  conservative_gm: number;
  match_confidence: number;
  coverage_confidence: number;
  freshness: number;
  corroboration: number;
  urgency_boost: number;
  score: number;
}

export interface EvidenceItem {
  kind: "external" | "internal";
  label: string;
  detail: string;
  url?: string;
  url_status?: string;
  source_id: string;
}

export interface Play {
  id: string;
  account_id: string;
  account_name: string;
  am: string;
  am_is_skeptic: boolean;
  archetype: string;
  headline: string;
  role_label: string;
  role_canonical: string;
  metro_label: string;
  metro_canonical: string;
  metro_is_new: boolean;
  open_reqs: number;
  match_confidence: number;
  coverage_confidence: number;
  gm: GmBand;
  rank: RankFactors;
  evidence: EvidenceItem[];
  suggested_move: string;
  draft_opener: string;
  opener_source: "llm" | "template";
  is_new_this_week: boolean;
}

export interface HeldItem {
  signal_id: string;
  account_id: string;
  account_name: string;
  am: string;
  role_label: string;
  metro_label: string;
  reason: string;
  kind: "am_owned_hard" | "note_surfaced";
  needs_confirm: boolean;
}

export interface DroppedItem {
  signal_id: string;
  account_id: string | null;
  account_name: string;
  reason: string;
  detail: string;
}

export interface RadarResult {
  run_week: string;
  generated_at: string;
  plays: Play[];
  also_surfaced: (AlsoSurfacedRow & { account_name: string; am: string })[];
  held: HeldItem[];
  dropped: DroppedItem[];
  meta: {
    accounts_scanned: number;
    signals_scanned: number;
    resolution_rate: number;
    needs_verification: number;
    needs_verification_examples: string[];
    total_conservative_gm: number;
    total_expected_gm: number;
    opener_source: "llm" | "template";
  };
}

export interface FeedbackEvent {
  play_id: string;
  account_id: string;
  disposition: string;
  reason?: string;
  won?: boolean;
  actual_gm?: number;
  note?: string;
  am?: string;
  ts: string;
}
