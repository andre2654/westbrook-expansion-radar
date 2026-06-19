import Link from "next/link";
import { getRadar } from "@/lib/result";
import { playTraits } from "@/lib/traits";
import { usd, usdShort, pct } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassCard, Crest } from "@/components/radar/glass";
import { TraitsRadar } from "@/components/radar/traits-radar";
import { Disclosure } from "@/components/radar/disclosure";
import { RunButton } from "@/components/radar/run-button";
import {
  Radar,
  Search,
  Calendar,
  ChevronDown,
  ArrowRight,
  Briefcase,
  Target,
  DollarSign,
  Clock,
  Crosshair,
  Layers,
  ShieldAlert,
  AlertTriangle,
  Info,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function RadarPage() {
  const r = await getRadar();
  const hero = r.plays[0];

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="crest flex h-8 w-8 items-center justify-center rounded-lg">
              <Radar className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-semibold tracking-tight">
              Westbrook <span className="text-muted-foreground">Radar</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="pill hidden sm:flex">
              <Calendar className="h-4 w-4" />
              Week of Jun 19, 2026
              <ChevronDown className="h-3.5 w-3.5 opacity-60" />
            </div>
            <div className="pill hidden text-muted-foreground/70 md:flex">
              <Search className="h-4 w-4" />
              Search accounts…
            </div>
            <RunButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div className="mb-5">
          <h1 className="text-2xl font-bold tracking-tight sm:text-[28px]">
            <span className="font-normal text-muted-foreground">Where the next</span> expansion is hiding
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Specific, evidenced plays inside accounts we already serve — never a generic opportunity score.
          </p>
        </div>

        {/* Hero: featured play + traits radar */}
        {hero && (
          <div className="grid gap-4 lg:grid-cols-5">
            <section className="hero-card p-6 lg:col-span-3 lg:p-8">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <Crest name={hero.account_name} className="h-14 w-14 text-lg" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-xs font-medium text-white/80">#1</span>
                      {hero.is_new_this_week && (
                        <Badge className="bg-success text-success-foreground hover:bg-success">new this week</Badge>
                      )}
                    </div>
                    <h2 className="mt-1 text-3xl font-bold tracking-tight text-white">{hero.account_name}</h2>
                    <p className="text-sm text-white/70">
                      {hero.role_label} whitespace · {hero.metro_label}
                    </p>
                  </div>
                </div>
                <Button asChild className="rounded-full">
                  <Link href={`/play/${hero.id}`}>View play</Link>
                </Button>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/55">
                <span>AM {hero.am}</span>
                <span className="opacity-40">|</span>
                <span>{hero.open_reqs} open reqs</span>
                <span className="opacity-40">|</span>
                <span>same-role geographic whitespace</span>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-x-10 gap-y-4">
                <Attr icon={<Briefcase className="h-4 w-4" />} label="Open reqs" value={String(hero.open_reqs)} />
                <Attr icon={<Crosshair className="h-4 w-4" />} label="Match confidence" value={pct(hero.match_confidence)} />
                <Attr icon={<Target className="h-4 w-4" />} label="Our realized fill" value={pct(hero.gm.inputs.realized_fill)} />
                <Attr icon={<Layers className="h-4 w-4" />} label="Coverage confidence" value={pct(hero.coverage_confidence)} />
                <Attr icon={<DollarSign className="h-4 w-4" />} label="Realized spread" value={`$${hero.gm.inputs.realized_spread.toFixed(2)}/hr`} />
                <Attr icon={<Clock className="h-4 w-4" />} label="Assignment length" value={`~${hero.gm.inputs.realized_hours}h`} />
              </div>

              <div className="mt-6 rounded-xl border border-white/10 bg-black/25 p-4">
                <div className="grid grid-cols-3 gap-3">
                  <GmStat label="Conservative" value={usd(hero.gm.conservative)} />
                  <GmStat label="Expected" value={usd(hero.gm.expected)} highlight />
                  <GmStat label="Stretch" value={usd(hero.gm.stretch)} />
                </div>
                <p className="mt-3 text-xs text-white/55">{hero.gm.math_note}</p>
              </div>
            </section>

            <GlassCard className="p-6 lg:col-span-2">
              <div className="flex items-center justify-between">
                <h3 className="text-lg tracking-tight">
                  <span className="font-normal text-muted-foreground">Play</span> <span className="font-bold">Traits</span>
                </h3>
                <Info className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">Every axis is a factor the radar actually ranks on.</p>
              <div className="mt-2">
                <TraitsRadar traits={playTraits(hero)} />
              </div>
            </GlassCard>
          </div>
        )}

        {/* Summary */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Plays surfaced" value={String(r.plays.length)} sub={`from ${r.meta.signals_scanned} signals`} />
          <Stat label="Net-new GM" value={usdShort(r.meta.total_conservative_gm)} sub={`${usdShort(r.meta.total_expected_gm)} expected`} />
          <Stat label="Held for conflict" value={String(r.held.length)} sub="radar declined" tone="warning" />
          <Stat label="Foundation gate" value={pct(r.meta.resolution_rate)} sub={`${r.meta.needs_verification} need verification`} />
        </div>

        {/* Ranked plays */}
        <SectionLabel>Ranked plays</SectionLabel>
        <div className="space-y-2.5">
          {r.plays.map((p, i) => (
            <Link key={p.id} href={`/play/${p.id}`} className="block">
              <GlassCard className="p-4 transition-transform hover:-translate-y-0.5">
                <div className="flex items-center gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-sm font-semibold text-primary">
                    {i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate font-medium">{p.headline}</span>
                      {p.is_new_this_week && <span className="text-[10px] font-medium text-success">● new</span>}
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      match {pct(p.match_confidence)} · coverage {pct(p.coverage_confidence)} · AM {p.am}
                    </div>
                  </div>
                  <div className="hidden text-right sm:block">
                    <div className="font-semibold tabular-nums">{usd(p.gm.conservative)}</div>
                    <div className="text-xs text-muted-foreground">– {usd(p.gm.expected)} exp.</div>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </div>
              </GlassCard>
            </Link>
          ))}
        </div>

        {/* Also surfaced */}
        <SectionLabel>
          Also surfaced <span className="font-normal normal-case text-muted-foreground/70">· lighter heuristics, no bespoke logic in v0</span>
        </SectionLabel>
        <div className="grid gap-3 sm:grid-cols-2">
          {r.also_surfaced.map((row) => (
            <GlassCard key={row.id} className="p-4">
              <div className="flex items-center justify-between gap-2">
                <Badge variant="outline" className="capitalize">{row.archetype.replace("_", " ")}</Badge>
                <Badge variant="secondary">{row.confidence}</Badge>
              </div>
              <div className="mt-2 text-sm font-medium">{row.headline}</div>
              <p className="mt-1 text-xs text-muted-foreground">{row.rationale}</p>
              <div className="mt-3 flex items-center justify-between border-t border-white/[0.06] pt-2 text-sm">
                <span className="tabular-nums">{usd(row.gm_band.conservative)} – {usd(row.gm_band.expected)}</span>
                <span className="text-right text-[11px] text-warning">{row.caveat}</span>
              </div>
            </GlassCard>
          ))}
        </div>

        {/* Held */}
        <div className="mt-8">
          <Disclosure
            defaultOpen
            title={
              <span className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-warning" />
                Held for relationship conflict ({r.held.length}) — the radar declined these
              </span>
            }
          >
            <div className="space-y-2">
              {r.held.map((h) => (
                <div key={h.signal_id} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">{h.account_name}</span>
                    <Badge variant={h.kind === "am_owned_hard" ? "destructive" : "outline"}>
                      {h.kind === "am_owned_hard" ? "AM-flagged (hard)" : "from notes"}
                    </Badge>
                    {h.needs_confirm && <Badge variant="secondary">needs AM confirm</Badge>}
                    <span className="text-xs text-muted-foreground">{h.role_label} · {h.metro_label} · {h.am}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{h.reason}</p>
                </div>
              ))}
            </div>
          </Disclosure>
        </div>

        {/* Dropped */}
        <div className="mt-3">
          <Disclosure
            title={
              <span className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                Considered &amp; dropped ({r.dropped.length}) — with reasons
              </span>
            }
          >
            <div className="space-y-2">
              {r.dropped.map((d) => (
                <div key={d.signal_id} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">{d.account_name}</span>
                    <Badge variant="outline">{d.reason}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{d.detail}</p>
                </div>
              ))}
            </div>
          </Disclosure>
          <p className="mt-2 text-xs text-muted-foreground">
            The trust is in what the radar rejects: already-served, stale/ghost reqs, and non-client-specific noise never
            reach the AM.
          </p>
        </div>

        <footer className="mt-10 border-t border-white/[0.06] pt-4 text-xs text-muted-foreground">
          Opener source: {r.meta.opener_source === "llm" ? "Claude (LLM)" : "deterministic template (add a key to .env.local for LLM)"} · external signals real, internal records a stand-in until ATS export · generated {r.generated_at}.
        </footer>
      </main>
    </div>
  );
}

function Attr({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-white/70">
        {icon}
      </div>
      <div>
        <div className="text-[11px] uppercase tracking-wide text-white/45">{label}</div>
        <div className="text-sm font-semibold text-white">{value}</div>
      </div>
    </div>
  );
}

function GmStat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-white/45">{label}</div>
      <div className={`text-lg font-semibold tabular-nums ${highlight ? "text-primary" : "text-white"}`}>{value}</div>
    </div>
  );
}

function Stat({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "warning" }) {
  return (
    <GlassCard className="p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`mt-0.5 text-2xl font-semibold tabular-nums ${tone === "warning" ? "text-warning" : ""}`}>{value}</div>
      {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
    </GlassCard>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-3 mt-8 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{children}</h2>;
}
