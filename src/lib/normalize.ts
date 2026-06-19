import type { NormResult } from "./types";

// ── Normalization: messy free-text → canonical role-family + metro, WITH a
// confidence score. This is the foundation. Until "Forklift Op / Reach Truck /
// Picker-Packer" collapse to one role-family and "Phx / Phenix / 85001" collapse
// to one metro, no join is trustworthy. Deterministic by default (dictionary +
// edit-distance fuzzy); an LLM tie-break is wired in llm.ts for low-confidence
// cases but is NOT required to run the demo.

function clean(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const d: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) d[i][0] = i;
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
    }
  }
  return d[m][n];
}

// canonical -> { label, alias keywords }
const ROLE_FAMILIES: { canonical: string; label: string; aliases: string[] }[] = [
  { canonical: "warehouse_ops", label: "Warehouse / light-industrial", aliases: ["warehouse", "warehouse associate", "warehouse assoc", "picker", "packer", "picker packer", "forklift", "forklift operator", "reach truck", "lift driver", "material handler"] },
  { canonical: "nursing", label: "Nursing (RN)", aliases: ["registered nurse", "rn", "nurse"] },
  { canonical: "allied_health", label: "Allied health", aliases: ["med tech", "medical technologist", "allied", "phlebotomist", "radiology tech"] },
  { canonical: "assembly", label: "Assembly", aliases: ["assembler", "assembly", "production associate"] },
  { canonical: "it", label: "IT", aliases: ["it help desk", "help desk", "helpdesk", "it support", "desktop support", "service desk"] },
  { canonical: "clerical", label: "Clerical / data entry", aliases: ["data entry", "data entry clerk", "clerk", "clerical", "administrative assistant"] },
  { canonical: "lab", label: "Laboratory", aliases: ["lab technician", "laboratory technician", "lab tech", "laboratory"] },
  { canonical: "merchandising", label: "Merchandising", aliases: ["merchandiser", "merchandising", "retail merchandiser"] },
];

const METROS: { canonical: string; label: string; aliases: string[] }[] = [
  { canonical: "dallas", label: "Dallas, TX", aliases: ["dallas", "dal", "dfw", "dallas tx", "dal whse"] },
  { canonical: "phoenix", label: "Phoenix, AZ", aliases: ["phoenix", "phx", "tempe", "85001", "phoenix az"] },
  { canonical: "columbus", label: "Columbus, OH", aliases: ["columbus", "columbus oh"] },
  { canonical: "newark", label: "Newark, NJ", aliases: ["newark", "newark nj"] },
  { canonical: "austin", label: "Austin, TX", aliases: ["austin", "austin tx"] },
  { canonical: "chicago", label: "Chicago, IL", aliases: ["chicago", "chi", "chicago il"] },
  { canonical: "boston", label: "Boston, MA", aliases: ["boston", "cambridge", "boston ma", "cambridge ma"] },
  { canonical: "raleigh", label: "Raleigh, NC", aliases: ["raleigh", "raleigh nc", "research triangle", "rtp"] },
];

function match(
  raw: string,
  table: { canonical: string; label: string; aliases: string[] }[]
): NormResult {
  const c = clean(raw);
  // exact / substring alias hit -> high confidence
  for (const row of table) {
    for (const alias of row.aliases) {
      if (c === alias) return { canonical: row.canonical, label: row.label, confidence: 0.97, reason: `exact match on "${alias}"` };
    }
  }
  for (const row of table) {
    for (const alias of row.aliases) {
      if (c.includes(alias) || alias.includes(c)) {
        return { canonical: row.canonical, label: row.label, confidence: 0.9, reason: `contains "${alias}"` };
      }
    }
  }
  // fuzzy: closest alias by edit distance (catches typos like "phenix" -> phoenix)
  let best: { canonical: string; label: string; alias: string; dist: number } | null = null;
  for (const row of table) {
    for (const alias of row.aliases) {
      const dist = levenshtein(c, alias);
      if (!best || dist < best.dist) best = { canonical: row.canonical, label: row.label, alias, dist };
    }
  }
  if (best && best.dist <= 2) {
    const conf = best.dist === 1 ? 0.85 : 0.72;
    return { canonical: best.canonical, label: best.label, confidence: conf, reason: `fuzzy match to "${best.alias}" (edit distance ${best.dist})` };
  }
  return { canonical: "unknown", label: raw, confidence: 0.35, reason: "no confident match — needs verification" };
}

export function normalizeRole(raw: string): NormResult {
  return match(raw, ROLE_FAMILIES);
}

export function normalizeMetro(raw: string): NormResult {
  return match(raw, METROS);
}
