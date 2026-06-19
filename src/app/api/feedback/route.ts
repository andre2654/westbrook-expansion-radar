import { NextResponse } from "next/server";
import { appendFeedback } from "@/lib/data";
import type { FeedbackEvent } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<FeedbackEvent>;
    if (!body.play_id || !body.disposition) {
      return NextResponse.json({ ok: false, error: "play_id and disposition required" }, { status: 400 });
    }
    const ev: FeedbackEvent = {
      play_id: body.play_id,
      account_id: body.account_id ?? "",
      disposition: body.disposition,
      reason: body.reason,
      won: body.won,
      actual_gm: body.actual_gm,
      note: body.note,
      am: body.am,
      ts: new Date().toISOString(),
    };
    appendFeedback(ev);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "bad request" }, { status: 400 });
  }
}
