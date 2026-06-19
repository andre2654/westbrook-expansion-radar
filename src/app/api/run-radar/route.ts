import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { runRadar } from "@/lib/pipeline";

export const dynamic = "force-dynamic";

export async function POST() {
  const result = await runRadar();
  fs.writeFileSync(path.join(process.cwd(), "data", "plays.json"), JSON.stringify(result, null, 2));
  return NextResponse.json({ ok: true, plays: result.plays.length });
}
