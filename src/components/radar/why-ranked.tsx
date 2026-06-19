"use client";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { RankFactors } from "@/lib/types";
import { usd } from "@/lib/format";

export function WhyRanked({ rank }: { rank: RankFactors }) {
  return (
    <Popover>
      <PopoverTrigger className="text-xs text-muted-foreground underline decoration-dotted underline-offset-2 hover:text-foreground">
        why ranked?
      </PopoverTrigger>
      <PopoverContent className="w-80 text-xs">
        <div className="mb-2 font-medium">
          Transparent score = <span className="tabular-nums">{rank.score}</span>
        </div>
        <ul className="space-y-1 tabular-nums">
          <li className="flex justify-between"><span>conservative GM ÷ 1,000</span><span>{usd(rank.conservative_gm)}</span></li>
          <li className="flex justify-between"><span>× match confidence</span><span>{rank.match_confidence}</span></li>
          <li className="flex justify-between"><span>× coverage confidence</span><span>{rank.coverage_confidence}</span></li>
          <li className="flex justify-between"><span>× freshness</span><span>{rank.freshness}</span></li>
          <li className="flex justify-between"><span>× corroboration</span><span>{rank.corroboration}</span></li>
          <li className="flex justify-between"><span>× (1 + urgency)</span><span>{1 + rank.urgency_boost}</span></li>
        </ul>
        <p className="mt-2 text-muted-foreground">
          No learned weights, no black-box score. Every factor is inspectable — that&apos;s the opposite of the generic
          &ldquo;opportunity score.&rdquo;
        </p>
      </PopoverContent>
    </Popover>
  );
}
