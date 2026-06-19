import type { Trait } from "@/lib/traits";

// Pure-SVG radar hexagon — the signature element. Plots 6 traits (0..1) as a
// filled blue polygon over faint concentric guides, with a big value + small
// label outside each vertex. No charting dependency; full control of the look.
export function TraitsRadar({ traits }: { traits: Trait[] }) {
  const W = 400;
  const H = 300;
  const cx = W / 2;
  const cy = H / 2 + 4;
  const R = 96;
  const n = traits.length;

  const ACCENT = "hsl(222 100% 63%)";

  const angle = (i: number) => (-90 + (360 / n) * i) * (Math.PI / 180);
  const pt = (i: number, r: number) => ({
    x: cx + Math.cos(angle(i)) * R * r,
    y: cy + Math.sin(angle(i)) * R * r,
  });

  const rings = [0.25, 0.5, 0.75, 1];
  const hexPoints = (r: number) =>
    Array.from({ length: n }, (_, i) => {
      const p = pt(i, r);
      return `${p.x},${p.y}`;
    }).join(" ");

  const dataPoints = traits.map((t, i) => pt(i, Math.max(0.04, t.value)));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Play traits radar">
      {/* guide rings */}
      {rings.map((r) => (
        <polygon key={r} points={hexPoints(r)} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={1} />
      ))}
      {/* spokes */}
      {Array.from({ length: n }, (_, i) => {
        const p = pt(i, 1);
        return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />;
      })}
      {/* data polygon */}
      <polygon
        points={dataPoints.map((p) => `${p.x},${p.y}`).join(" ")}
        fill="hsl(222 100% 63% / 0.28)"
        stroke={ACCENT}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3} fill={ACCENT} stroke="hsl(222 32% 6%)" strokeWidth={1.5} />
      ))}
      {/* labels */}
      {traits.map((t, i) => {
        const a = angle(i);
        const lx = cx + Math.cos(a) * (R + 30);
        const ly = cy + Math.sin(a) * (R + 30);
        const cos = Math.cos(a);
        const anchor = cos > 0.3 ? "start" : cos < -0.3 ? "end" : "middle";
        return (
          <g key={i}>
            <text x={lx} y={ly - 2} textAnchor={anchor} className="fill-foreground" fontSize={14} fontWeight={600}>
              {t.display}
            </text>
            <text x={lx} y={ly + 12} textAnchor={anchor} fill="hsl(220 11% 64%)" fontSize={10}>
              {t.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
