"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usd } from "@/lib/format";
import type { GmBand } from "@/lib/types";

// Editable, fully-visible GM math. The AM can challenge any assumption and watch
// the band move. A defensible number an AM can interrogate beats a flashy number
// they can't.
export function GmCalculator({ gm }: { gm: GmBand }) {
  const [openReqs, setOpenReqs] = useState(gm.inputs.open_reqs);
  const [fill, setFill] = useState(Math.round(gm.inputs.realized_fill * 100));
  const [haircut, setHaircut] = useState(gm.inputs.cold_geo_haircut);
  const [spread, setSpread] = useState(gm.inputs.realized_spread);
  const [hours, setHours] = useState(gm.inputs.realized_hours);

  const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
  const expectedHeads = clamp(Math.round(openReqs * (fill / 100) * haircut), 0, openReqs);
  const conservativeHeads = clamp(Math.round(expectedHeads * 0.65), 1, openReqs);
  const stretchHeads = clamp(Math.round(expectedHeads * 1.4), expectedHeads, openReqs);
  const head = (h: number) => Math.round(h * spread * hours);
  const annual = Math.round(expectedHeads * spread * 2080);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Field label="Open reqs" value={openReqs} onChange={setOpenReqs} />
        <Field label="Our fill %" value={fill} onChange={setFill} />
        <Field label="Cold-geo haircut" value={haircut} step={0.05} onChange={setHaircut} />
        <Field label="Spread $/hr" value={spread} step={0.1} onChange={setSpread} />
        <Field label="Hours/assignment" value={hours} step={10} onChange={setHours} />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Band label="Conservative" heads={conservativeHeads} value={head(conservativeHeads)} tone="muted" />
        <Band label="Expected" heads={expectedHeads} value={head(expectedHeads)} tone="primary" />
        <Band label="Stretch" heads={stretchHeads} value={head(stretchHeads)} tone="muted" />
      </div>

      <p className="text-sm text-muted-foreground">
        {openReqs} open reqs × {fill}% our realized fill × {haircut} cold-geo haircut ≈ <b>{expectedHeads} winnable heads</b> ×
        ${spread.toFixed(2)}/hr × {hours}h per assignment period.
      </p>
      <p className="text-xs text-muted-foreground">
        Figures are <b>per assignment period</b> (temp assignments run weeks, not a year). If this crew were sustained
        year-round, the annualized run-rate would be <b>{usd(annual)}</b> — labeled separately on purpose so we never
        quote a full-year FTE number as if it were booked.
      </p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  step?: number;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input
        type="number"
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-9 tabular-nums"
      />
    </div>
  );
}

function Band({ label, heads, value, tone }: { label: string; heads: number; value: number; tone: "primary" | "muted" }) {
  return (
    <div className={tone === "primary" ? "rounded-lg border-2 border-primary/30 bg-primary/5 p-3" : "rounded-lg border bg-card p-3"}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold tabular-nums">{usd(value)}</div>
      <div className="text-xs text-muted-foreground">{heads} heads</div>
    </div>
  );
}
