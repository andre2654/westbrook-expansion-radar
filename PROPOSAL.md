# Account Expansion Opportunity Radar — Proposal
**Westbrook Talent Partners · Forward Deployed AI Engineer · André Saraiva**

*Read in one sitting: §1–§2. Build from it: §3–§7. There’s also a working demo in this repo — `npm install && npm run radar && npm run dev`.*

---

## 1. The reframe (what I actually built)

You asked for a radar that tells account managers where the next expansion is hiding. **The radar is the easy part.** The hard part — and the real value — is two things the brief points straight at:

1. a **trustworthy join** between your messy account history and external hiring signals, and
2. a **guardrail** that keeps a play from ever conflicting with a client relationship.

So the first win I’d ship is *not* a generic opportunity score (the brief’s own trap — AMs don’t trust a black-box 0–100). It’s a small loop that proves **an AM will trust and pursue one evidenced play built from your real, inconsistently-structured data — and will trust the radar to visibly hold back a play that would damage a relationship.** A system that *declines* a risky play earns more trust than ten it surfaces.

Everything below ladders to the KPI: **net-new gross margin from expansion within existing accounts.**

The unit of value is an **evidenced play**, never a score. It answers the only four questions an AM has:

> *Can we deliver it? Is it actually open to us? What’s it worth — and why should I believe the number? What could blow up the relationship?*

A worked example the demo generates from messy data:

> **GXO Logistics — warehouse whitespace, Phoenix.** We staff ~12 warehouse associates for GXO in Dallas (91% realized fill, $9.00/hr realized spread, ~7-mo assignments). GXO just posted 15 employer-direct forklift reqs in **Phoenix**, where we don’t serve them, and announced a Phoenix DC. **Est. net-new GM: $47K (conservative) – $76K (expected)** per assignment period — 15 reqs × 91% fill × 0.6 cold-geo haircut ≈ 8 winnable heads. Evidence: [live posting] + our Dallas placement rows. Suggested move: warm intro from the Dallas AM; draft opener attached. *Confirm open to us before pursuing.*

---

## 2. Bottom-Up MVP — "Radar v0"

**Smallest working loop:** one weekly run over **5 pinned pilot accounts**, **one archetype built for real** (same-role geographic whitespace), everything else a static row or a stub. Delivered into the AM’s existing weekly surface (pipeline review / CRM task / digest) — never a new tool to remember.

**What it does:** pull internal facts (and *time the dirt*) → pull external triggers from a licensed postings API → resolve identity **closed-world** to the 5 accounts → deterministic gap detection → **grounded** GM band with visible math → evidenced play with a live citation + editable opener → rank by a transparent rule → capture the disposition (`pursue / already-on-it / not-now / not-a-fit + reason`).

**What it deliberately ignores (each safe for now):** full ATS cleanup (but a *dirt log* measures the mess so the real ask is evidenced), real-time webhooks (cadence is weekly), auto-send outreach (the AM owns the send — permanently), a learned ML ranker (no training data; a black box erodes trust), perm-fee/funding/M&A signals, voice/telephony, multi-tenant/SSO, and the 2nd/3rd archetypes (shipped as static “also surfaced” rows).

**How we’d know within weeks — leading vs lagging, gaming-resistant:**
- **Week 1 (foundation gate):** publish the real entity/role/geo resolution rate on the pilot slice. If it’s low, *fix data before generating plays.*
- **Weeks 1–2 (leading):** AMs mark ≥3 of 10 as **pursue** (behavior, not a vanity click), with sensible kill-reasons — reported **friendly-vs-skeptic** so selection bias is visible.
- **Weeks 2–4 (safety, the primary gate):** **landmine recall** — catch dangerous false-negatives, not the cheap false-positive.
- **Weeks 3–6 (the real test):** ≥1 play reaches an actual client conversation **and** ≥1 GM estimate is reconciled against actual won spread. **One account held out as a control** so net-new GM is auditable, not self-reported.
- **Kill condition:** if AMs kill most plays as `wrong-data`/`already-filled`, the join is broken — fix the foundation before scaling accounts.

---

## 3. System Architecture

A weekly **batch** job. Five pinned accounts, one Postgres, one screen, one run. Every box ties to net-new GM or to AM trust.

```
WEEKLY TRIGGER (Mon 6am) — external scheduler (cron/GitHub Action), idempotent run_id
        │   (NOT in-db pg_cron — >10-min ceiling, free-tier pause)
        ▼
1. INGEST → land RAW into Postgres JSONB (the mess IS the evidence we later cite)
     internal: ATS export (placements, depts, locations, END dates, realized fill/spread/hours)
     external: licensed postings API + WARN feed + announced-DC news (employer-direct)
        ▼
2. RESOLVE (closed-world → 5 pinned ids): deterministic blocking + LLM tie-break →
     match + confidence + reason; below floor → HELD for human review, never silently joined
     + LLM structured extraction (messy title/geo → typed cols, WITH confidence)
        ▼
3. POSTGRES: accounts · placements · signals · play_candidates · plays · feedback · outcomes
        ▼
4. GAP DETECT (SQL) → candidate + coverage-confidence flag (true whitespace vs unmatched data)
   GM (grounded formula, NOT free LLM math): heads = open_reqs × OUR realized fill × cold-geo
        haircut; × OUR realized spread × OUR realized hours → band (cons/exp/stretch)
   GENERATE: LLM writes narrative + editable opener
   GROUNDING GATE (two-part): every URL re-fetches live AND every GM input traces to a real row — else DROP
        ▼
5. RANK (transparent): conservative_GM × match_conf × coverage_conf × freshness × corroboration
        ▼
STAGE-1 HUMAN GATE — sales-ops vets the batch before AMs see it (auto-publish is *earned*)
        ▼
6. AM SURFACE (Next.js): play cards · evidence panel (live links beside our placement rows) ·
   GM band w/ visible math · editable never-auto-sent opener · [Pursue][Already-on-it][Not-now][Not-a-fit]
        ▼
FEEDBACK + OUTCOME → adoption signal + manual GM attribution (credit only incremental wins vs control)

[Future seams, out of MVP] pgvector · per-AM RLS · webhooks · graph DB · automated attribution · voice
```

**Durable spine (v1 isn’t throwaway):** normalized schema · pinned-entity match table with confidence · an **immutable evidence store that snapshots each posting at capture time** (so a play stays reproducible after the posting is deleted — a 404’d link next week destroys trust) · the play record · the disposition/feedback log. The demo implements this loop end-to-end against flat-file fixtures.

---

## 4. Build vs. Buy — *buy the commodity, fix the foundation, build the judgment*

The raw account data isn’t a moat (you own it badly; competitors own theirs). The moat is what the system **accumulates**: the cleaned join + Westbrook-specific resolution rules + the growing library of AM accept/dismiss decisions — which expansions trip MSP exclusivity, which clients handle a function internally. No vendor can see that.

| Capability | Decision | Why (cost / latency / control / lock-in) |
|---|---|---|
| CRM/ATS (system of record) | **Buy/keep, read-only v1** | Rebuild = multi-year, $0 GM. Write-back is a governance decision the client owns. |
| **ATS normalization (foundation)** | **Build — first, largest effort** | No trustworthy join until role/geo collapse to canon. Our data → our code; zero lock-in. |
| External job postings | **Integrate a licensed API** | Never scrape (ToS/legal, breakage, no edge). Gate on a coverage spike-test on 5 real accounts first. |
| Non-posting signals (DC openings, WARN) | **Integrate — separate, cheap** | The best staffing signal (new DC → mass hiring) isn’t on a job board. v1 picks one public source. |
| Entity resolution | **Build thin** | Deterministic + fuzzy + LLM tie-break + conservative floor. The threshold is a relationship-risk decision. |
| LLM inference | **Buy usage-based (Claude)** | ~low-tens-of-$/run. `LLMClient` interface → a swap is a re-test, not a no-op. |
| Data store | **Buy managed Postgres + JSONB** | One engine; the “graph” at MVP is relational tables. The anti-lock-in choice. |
| **Evidenced-play generator + suppression** | **Build — the reason we’re here** | Output contract: specific, evidenced, citable plays — never a bare score. |
| Orchestration | **Buy thin — one cron** | Weekly cadence. No Temporal/Inngest (range-showing). |
| AM surface | **Build the review UI, rent the rail** | Own where adoption is won; rent the Slack/Teams digest into where AMs already work. |
| Voice / telephony | **Don’t build** | Highest cost/latency, lowest trust, $0 GM at validation. An AI calling clients is the fastest landmine. |

**Lock-in, honest:** thin interfaces make a swap a *bounded re-integration + re-test, not a free config flip.* Cheap to **prove** (~low-hundreds–$1–2K/mo infra); the real commitments are build-time and, at scale, the enterprise data contract ($15–50K/yr). **Prove net-new GM on commodity infra first, sign the data contract second.**

---

## 5. Human-in-the-Loop Ramp — earn the right to automate; never automate the relationship

- **Stage 0 — Concierge / Wizard-of-Oz (wk 0–3).** Human does more than the machine. One signal, 2–3 AMs (incl. a skeptic), ~10 accounts. *Foundation test first:* ≥90% match precision on a hand-checked sample. **Graduate:** ≥50% of plays pursued + “I’d not have spotted this”; ≥5 expansion conversations booked; ≥20 landmine reason-codes harvested.
- **Stage 1 — Assisted radar (wk 3–10).** Machine drafts, human is editor-in-chief, inside existing CRM/Slack. AM always sends. AM-owned suppression auto-hides locked/at-risk accounts. **Graduate:** landmine recall ≥90% (gated *before* the cheap false-positive); ≥60% of AMs act weekly; surfaced→pursued ≥45% **and ≥1 win vs a matched control**.
- **Stage 2 — Supervised semi-automation (wk 10–18).** Auto-drafts in the AM’s tone; routes **green** to a ready-to-send queue, **amber** (any conflict/thin evidence/low match-conf) to mandatory review. The guardrail is **not** a bespoke ML classifier (hopeless on dozens of labels) — it’s AM-owned hard suppression + an LLM reviewer that **cites evidence** and defaults to amber. Send is always human.
- **Stage 3 — Automate the mechanical, supervise the judgment (wk 18+).** Full pipeline automation. **Never automated:** (1) the relationship judgment; (2) the client conversation.

**Attribution** makes the KPI falsifiable: from Stage 1, report **incremental** net-new GM (pilot − control), or audited AM “would-not-have-found” attestation where no clean control exists.

---

## 6. Assumptions (stated as decisions — tell me where I’m wrong)

Read-only ATS exports in v1 (no write-back) · weekly batch cadence (matches the brief and the assignment-end-date clock) · ~hundreds of accounts → Postgres, not a distributed store · external = licensed API + WARN + DC feeds, **never scraping** · 5 pinned accounts so matching is closed-world; pilot includes a **skeptic** AM · the AM owns all client contact and the relationship-flag list · **confirm AMs are comp’d on expansion GM** (if not, that’s a foundation-fix before build) · every GM input anchored to Westbrook’s **own realized** history; sparse data labeled “directional” · one account held out as a control.

> *Where I assumed wrong, tell me — these are the cheapest things to change and the first I’d validate on day one.*

---

## 7. Why this shape

Confidence is in the **restraint**: one archetype done undeniably well, a GM number deliberately discounted, a radar that declines plays, and a clear list of what I chose *not* to build. Crude where it’s allowed to be, durable where it counts — boring Postgres + a batch job + one LLM call + a thin UI is what survives the handoff to your team.
