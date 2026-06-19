# Westbrook Expansion Radar — v0

A thin, working slice of an **Account Expansion Opportunity Radar** for Westbrook Talent Partners (a staffing & workforce-solutions firm). It turns Westbrook's own (messy) account history + external hiring signals into a short, ranked list of **specific, evidenced expansion plays** an account manager (AM) can actually pursue — and it **visibly holds back** plays that would risk a client relationship.

> **The thesis:** the first win isn't "a model that scores accounts" (that's the trap — a generic score AMs don't trust). It's proving an AM will **trust and pursue one evidenced play** built from real, messy data — and trust the radar to **decline** a risky one. Everything ladders to the KPI: *net-new gross margin from expansion within existing accounts.*

**📄 Full proposal:** [`docs/Westbrook-Expansion-Radar-Proposal.pdf`](docs/Westbrook-Expansion-Radar-Proposal.pdf) (executive-readable, with screenshots) · markdown source: [`PROPOSAL.md`](PROPOSAL.md)

## Run it (one minute)

```bash
npm install
npm run radar     # runs the pipeline, prints a verification summary, writes data/plays.json
npm run dev       # http://localhost:3000
```

- `npm run radar` is the weekly batch job. It’s deterministic — it pre-bakes `data/plays.json` so the UI never waits on a live API in front of a stakeholder.
- The UI reads `data/plays.json`. The **Re-run weekly radar** button (and `POST /api/run-radar`) regenerates it live.
- **Optional LLM:** put a key in `.env.local` (gitignored) to have Claude compose the draft opener:
  - `OPENROUTER_API_KEY=...` (uses OpenRouter; override the model with `OPENROUTER_MODEL`, default `anthropic/claude-3.5-haiku`), or
  - `ANTHROPIC_API_KEY=...` (calls the Anthropic API directly).
  With no key it falls back to a deterministic template — the demo runs fully without credentials. The LLM is a *formatter only*: it never picks accounts, computes GM, or ranks.

## What you’re looking at

- **Ranked plays** — one archetype (same-role *geographic whitespace*) built for real. Each play carries a haircut GM band with visible math, an evidence chain (external trigger + our internal placement rows), a client-match checkpoint, an editable draft opener, and feedback buttons.
- **Held for conflict** — the radar declines two plays: one **AM-flagged** (at-risk account, hard suppression) and one **surfaced from free-text notes** ("client handles IT internally") that it asks the AM to confirm rather than deciding alone.
- **Considered & dropped** — already-served, a stale/ghost repost, and a non-client-specific macro headline, each with the reason. *The trust is in what it rejects.*
- **Foundation gate** — the % of role/geo/client fields auto-resolved from messy data, and what got routed to human verification. On real ATS data this is the metric we'd publish in week 1 *before* generating any plays.

## Demo-data convention (important, and honest)

- **External signals are real.** The hero play points at a **real employer careers site** (GXO Logistics). Job postings rot, so this is the one thing to refresh on submission day:
  1. Find a live GXO (or comparable 3PL) warehouse/forklift req in a city, copy its URL.
  2. Paste it into `data/external_signals.json` → `sig_gxo_phx_fork.url`, set `url_status` to `"verified"`.
  3. (Prod note) we snapshot each posting at capture time so the evidence link never 404s later.
- **Internal placement records are a realistic stand-in** until we get Westbrook's ATS export. The messiness is intentional — it lives on the dimensions that *break the join* (legal-name variants, free-text geo, role drift, blank end-dates).

## Built for real vs. deliberately stubbed

| Built for real | Stubbed / deferred (on purpose) |
|---|---|
| Normalization w/ confidence (dict + edit-distance fuzzy) | Full ATS ingestion & cleanup (scoped by the foundation metric) |
| Closed-world entity resolution (no false-merge risk) | Real-time webhooks (cadence is weekly) |
| Deterministic gap detection + provenance/freshness gates | Learned ML ranker / propensity score (no training data; black box erodes trust) |
| Grounded GM band (own realized fill/spread/hours) | Auto-send outreach (AM owns the send — permanently) |
| Transparent ranking (named factors, zero learned weights) | Perm-fee modeling, funding/M&A signals, voice/telephony |
| Two-guardrail suppression (AM-owned + note-surfaced) | 2nd/3rd archetypes (shipped as static "also surfaced" rows) |
| Feedback + outcome write-back loop | Multi-tenant / SSO |

## Architecture (one line)

A weekly batch job: **ingest raw → normalize (LLM-assisted, with confidence) → closed-world resolve → deterministic gap detect → grounded GM → transparent rank → human gate → AM surface → feedback/outcome.** One Postgres in production; here the `/data/*.json` files are "the whole world" so a peer can read it in one screen.

```
src/lib/
  normalize.ts   role/metro/client → canonical + confidence (the foundation)
  resolve.ts     closed-world entity match to the 5 pinned accounts
  gap.ts         deterministic whitespace detection + freshness/provenance/coverage
  suppress.ts    (1) AM-owned hard flags  (2) note-surfaced candidate conflicts
  gm.ts          haircut GM band from realized history (never a 1,800h FTE assumption)
  rank.ts        transparent score = named factors, no learned weights
  llm.ts         opener composer — Claude if key, deterministic template otherwise
  pipeline.ts    orchestrates the weekly run; emits plays / held / dropped + foundation metric
  traits.ts      maps a play's real ranking factors onto 6 "Play Traits" axes
scripts/run-radar.ts   the weekly batch entrypoint (npm run radar)
src/components/radar/   traits-radar (signature SVG hexagon) · glass · gm-calculator · play-actions · …
src/app/               Next.js UI: /, /play/[id], /api/feedback, /api/run-radar
data/                  the synthetic-internal + real-external world
```

## Look & feel

Dark "scouting-dashboard" aesthetic (near-black canvas, glass cards lit from within, one blue accent, mixed-weight headlines). Each play gets a **Play Traits hexagon** — a custom SVG radar plotting the *real* ranking factors (match, coverage, freshness, corroboration, GM size, win rate), so the chart is an honest fingerprint of why a play ranks where it does, not decoration.

Boring, durable choices under the hood — Postgres + a batch job + one LLM call + a thin UI. Boring is what survives the handoff to your team.
