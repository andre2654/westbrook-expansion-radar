import { NextResponse } from "next/server";
import fs from "fs";
import os from "os";
import path from "path";
import { runRadar } from "@/lib/pipeline";

export const dynamic = "force-dynamic";

export async function POST() {
  const result = await runRadar();
  const out = JSON.stringify(result, null, 2);
  // Persist to data/ locally; fall back to /tmp on a read-only serverless host
  // (getRadar prefers /tmp when present, so the re-run still takes effect).
  try {
    fs.writeFileSync(path.join(process.cwd(), "data", "plays.json"), out);
  } catch {
    fs.writeFileSync(path.join(os.tmpdir(), "westbrook-plays.json"), out);
  }
  return NextResponse.json({ ok: true, plays: result.plays.length });
}
