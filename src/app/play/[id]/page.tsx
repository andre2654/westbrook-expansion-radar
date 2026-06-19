import Link from "next/link";
import { notFound } from "next/navigation";
import { getPlay } from "@/lib/result";
import { playTraits } from "@/lib/traits";
import { usd, pct } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { GlassCard, Crest } from "@/components/radar/glass";
import { TraitsRadar } from "@/components/radar/traits-radar";
import { WhyRanked } from "@/components/radar/why-ranked";
import { GmCalculator } from "@/components/radar/gm-calculator";
import { OpenerEditor } from "@/components/radar/opener-editor";
import { PlayActions } from "@/components/radar/play-actions";
import { ArrowLeft, ExternalLink, Building2, Link2, Radar } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PlayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await getPlay(id);
  if (!p) notFound();

  const external = p.evidence.filter((e) => e.kind === "external");
  const internal = p.evidence.filter((e) => e.kind === "internal");

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <Button asChild variant="ghost" size="sm" className="-ml-2">
            <Link href="/">
              <ArrowLeft className="mr-1 h-4 w-4" /> Radar
            </Link>
          </Button>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Radar className="h-4 w-4 text-primary" /> Westbrook Radar
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        {/* Hero header */}
        <section className="hero-card p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <Crest name={p.account_name} className="h-14 w-14 text-lg" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-xs font-medium text-white/80">whitespace</span>
                  {p.is_new_this_week && (
                    <Badge className="bg-success text-success-foreground hover:bg-success">new this week</Badge>
                  )}
                  {p.am_is_skeptic && <Badge variant="outline" className="text-white/80">skeptic AM</Badge>}
                </div>
                <h1 className="mt-1 text-2xl font-bold tracking-tight text-white">{p.account_name}</h1>
                <p className="text-sm text-white/70">
                  {p.role_label} whitespace · {p.metro_label} · {p.open_reqs} open reqs · AM {p.am}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[11px] uppercase tracking-wide text-white/45">Expected net-new GM</div>
              <div className="text-2xl font-semibold tabular-nums text-white">{usd(p.gm.expected)}</div>
              <div className="text-xs text-white/55">{usd(p.gm.conservative)} – {usd(p.gm.stretch)}</div>
            </div>
          </div>
        </section>

        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {/* GM */}
            <GlassCard className="p-5">
              <SectionTitle>Estimated net-new gross margin</SectionTitle>
              <p className="mb-3 text-xs text-muted-foreground">
                Anchored to Westbrook&apos;s own realized history for this client + role. Challenge any assumption — the band moves.
              </p>
              <GmCalculator gm={p.gm} />
            </GlassCard>

            {/* Evidence */}
            <GlassCard className="p-5">
              <SectionTitle>Evidence chain</SectionTitle>
              <p className="mb-3 text-xs text-muted-foreground">No citation, no play. Every claim traces to a source.</p>

              <Label icon={<ExternalLink className="h-3.5 w-3.5" />}>External trigger</Label>
              <div className="space-y-2">
                {external.map((e) => (
                  <div key={e.source_id} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-sm font-medium">{e.label}</div>
                        <div className="text-xs text-muted-foreground">{e.detail}</div>
                      </div>
                      {e.url && (
                        <a
                          href={e.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex shrink-0 items-center gap-1 text-xs text-primary hover:underline"
                        >
                          open <Link2 className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                    {e.url_status && e.url_status !== "verified" && (
                      <div className="mt-1 text-[11px] text-warning">
                        {e.url_status === "unverified_stub"
                          ? "real employer site — paste a verified live req + snapshot before submitting"
                          : e.url_status}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-4">
                <Label icon={<Building2 className="h-3.5 w-3.5" />}>Internal anchor — why we can win it</Label>
              </div>
              <div className="space-y-2">
                {internal.map((e) => (
                  <div key={e.source_id} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                    <div className="text-sm font-medium">{e.label}</div>
                    <div className="text-xs text-muted-foreground">{e.detail}</div>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Opener */}
            <GlassCard className="p-5">
              <SectionTitle>Suggested move</SectionTitle>
              <p className="mb-3 text-sm">{p.suggested_move}</p>
              <Separator className="my-3" />
              <SectionTitle>Draft opener</SectionTitle>
              <div className="mt-2">
                <OpenerEditor initial={p.draft_opener} source={p.opener_source} />
              </div>
            </GlassCard>

            {/* Actions */}
            <GlassCard className="p-5">
              <SectionTitle>Your call</SectionTitle>
              <div className="mt-3">
                <PlayActions playId={p.id} accountId={p.account_id} am={p.am} matchConfidence={p.match_confidence} />
              </div>
            </GlassCard>
          </div>

          {/* Right rail: traits + ranking */}
          <div className="space-y-4">
            <GlassCard className="p-5">
              <div className="flex items-center justify-between">
                <SectionTitle>
                  <span className="font-normal text-muted-foreground">Play</span> Traits
                </SectionTitle>
                <WhyRanked rank={p.rank} />
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">Every axis is a factor the radar ranks on.</p>
              <div className="mt-2">
                <TraitsRadar traits={playTraits(p)} />
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                <Mini label="Match" value={pct(p.match_confidence)} />
                <Mini label="Coverage" value={pct(p.coverage_confidence)} />
                <Mini label="Freshness" value={pct(p.rank.freshness)} />
                <Mini label="Rank score" value={String(p.rank.score)} />
              </div>
            </GlassCard>
          </div>
        </div>
      </main>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-sm font-semibold">{children}</h2>;
}

function Label({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
      {icon} {children}
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="font-semibold tabular-nums">{value}</div>
    </div>
  );
}
