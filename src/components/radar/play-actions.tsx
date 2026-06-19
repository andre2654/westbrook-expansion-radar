"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { CheckCircle2, ShieldQuestion } from "lucide-react";
import { pct } from "@/lib/format";

const NOT_A_FIT_REASONS = [
  "MSP-owned",
  "In-house",
  "Out-of-scope",
  "At-risk",
  "Bad timing",
  "Already filled",
  "Wrong data",
];

export function PlayActions({
  playId,
  accountId,
  am,
  matchConfidence,
}: {
  playId: string;
  accountId: string;
  am: string;
  matchConfidence: number;
}) {
  const [confirmed, setConfirmed] = useState(false);
  const [chosen, setChosen] = useState<string | null>(null);
  const [reason, setReason] = useState<string>("");
  const [wonGm, setWonGm] = useState<string>("");

  async function send(disposition: string, extra: Record<string, unknown> = {}) {
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ play_id: playId, account_id: accountId, am, disposition, ...extra }),
      });
      if (!res.ok) throw new Error();
      setChosen(disposition);
      toast.success(`Logged: ${disposition}`, { description: "Captured as the trust signal (surfaced → pursued → won)." });
    } catch {
      toast.error("Could not save");
    }
  }

  return (
    <div className="space-y-4">
      {/* Relationship checkpoint — the AM owns the relationship; nothing is pursued
          until they confirm the match is right. */}
      <div className="rounded-lg border bg-card p-3">
        <div className="mb-2 flex items-center gap-2 text-sm font-medium">
          <ShieldQuestion className="h-4 w-4 text-muted-foreground" />
          Relationship checkpoint
        </div>
        {confirmed ? (
          <div className="flex items-center gap-2 text-sm text-success">
            <CheckCircle2 className="h-4 w-4" /> Account confirmed by {am}.
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-muted-foreground">
              Client match <Badge variant="secondary">{pct(matchConfidence)}</Badge> — confirm this is your account before pursuing.
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setConfirmed(true);
                toast.success("Confirmed — actions unlocked");
              }}
            >
              Confirm this is my account
            </Button>
          </div>
        )}
      </div>

      {/* Dispositions — the trust signal. */}
      <div className="flex flex-wrap gap-2">
        <Button disabled={!confirmed || chosen === "pursue"} onClick={() => send("pursue")}>
          Pursue
        </Button>
        <Button variant="outline" disabled={!confirmed} onClick={() => send("already_on_it")}>
          Already on it
        </Button>
        <Button variant="outline" disabled={!confirmed} onClick={() => send("snooze")}>
          Not now
        </Button>
        <div className="flex items-center gap-2">
          <Select value={reason} onValueChange={setReason}>
            <SelectTrigger className="h-9 w-[150px]" disabled={!confirmed}>
              <SelectValue placeholder="Not a fit…" />
            </SelectTrigger>
            <SelectContent>
              {NOT_A_FIT_REASONS.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            disabled={!confirmed || !reason}
            onClick={() => send("not_a_fit", { reason })}
          >
            Log
          </Button>
        </div>
      </div>

      {chosen && (
        <p className="text-xs text-muted-foreground">
          Last disposition logged: <b>{chosen}</b>. These vetoes are the gold training signal — they teach the radar the
          landmines no vendor can see.
        </p>
      )}

      {/* Outcome reconciliation — closes the loop on the headline KPI. */}
      <div className="rounded-lg border border-dashed p-3">
        <div className="mb-2 text-sm font-medium">Outcome (weeks later)</div>
        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Actual net-new GM won ($)</Label>
            <Input
              type="number"
              value={wonGm}
              onChange={(e) => setWonGm(e.target.value)}
              placeholder="e.g. 61000"
              className="h-9 w-40 tabular-nums"
            />
          </div>
          <Button
            variant="secondary"
            disabled={!wonGm}
            onClick={() => send("won", { won: true, actual_gm: Number(wonGm) })}
          >
            Mark won
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Reconciling the estimate against actual won spread is how we calibrate fill-rate and make the net-new-GM claim
          auditable (vs the held-out control account).
        </p>
      </div>
    </div>
  );
}
