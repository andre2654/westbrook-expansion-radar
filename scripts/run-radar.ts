import fs from "fs";
import path from "path";
import { runRadar } from "../src/lib/pipeline";

const fmt = (n: number) => n.toLocaleString("en-US");

// Next.js auto-loads .env.local for the dev server / API routes; this standalone
// script does not, so load it manually here (keys not already in the env win).
function loadEnvLocal() {
  try {
    const p = path.join(process.cwd(), ".env.local");
    if (!fs.existsSync(p)) return;
    for (const line of fs.readFileSync(p, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {
    /* ignore */
  }
}

async function main() {
  loadEnvLocal();
  const result = await runRadar();
  const out = path.join(process.cwd(), "data", "plays.json");
  fs.writeFileSync(out, JSON.stringify(result, null, 2));

  console.log("\n=== Westbrook Expansion Radar — run", result.run_week, "===");
  console.log(
    `Foundation gate: ${(result.meta.resolution_rate * 100).toFixed(1)}% of fields auto-resolved · ` +
      `${result.meta.needs_verification} routed to human verification` +
      (result.meta.needs_verification ? ` (${result.meta.needs_verification_examples.join("; ")})` : "")
  );
  console.log(
    `Opener source: ${result.meta.opener_source}` +
      (result.meta.opener_source === "template" ? " (set OPENROUTER_API_KEY or ANTHROPIC_API_KEY in .env.local to use the LLM)" : "")
  );

  console.log("\nPLAYS (ranked, evidenced):");
  result.plays.forEach((p, i) =>
    console.log(
      `  ${i + 1}. [score ${p.rank.score}] ${p.headline}\n` +
        `     GM band $${fmt(p.gm.conservative)} – $${fmt(p.gm.expected)} – $${fmt(p.gm.stretch)} | ${p.gm.math_note}\n` +
        `     match ${p.match_confidence} · coverage ${p.coverage_confidence} · ${p.evidence.filter((e) => e.kind === "external").length} external + ${p.evidence.filter((e) => e.kind === "internal").length} internal evidence`
    )
  );

  console.log("\nALSO SURFACED (lighter heuristics, no bespoke logic in v0):");
  result.also_surfaced.forEach((r) => console.log(`  - [${r.confidence}] ${r.headline}`));

  console.log("\nHELD for relationship conflict (the radar declines these):");
  result.held.forEach((h) => console.log(`  - ${h.account_name} [${h.kind}${h.needs_confirm ? ", needs AM confirm" : ""}]: ${h.reason}`));

  console.log("\nCONSIDERED & DROPPED (with reasons — the trust is in what we reject):");
  result.dropped.forEach((d) => console.log(`  - ${d.account_name}: ${d.reason} — ${d.detail}`));

  console.log(
    `\nTotal surfaced net-new GM (this week): $${fmt(result.meta.total_conservative_gm)} conservative · $${fmt(result.meta.total_expected_gm)} expected`
  );
  console.log("Wrote", out, "\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
