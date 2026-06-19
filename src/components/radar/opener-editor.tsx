"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Copy } from "lucide-react";

export function OpenerEditor({ initial, source }: { initial: string; source: "llm" | "template" }) {
  const [text, setText] = useState(initial);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Badge variant="secondary" className="text-xs">
          draft · {source === "llm" ? "LLM-composed from verified facts" : "template (no API key set)"}
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={() => {
            navigator.clipboard?.writeText(text);
            toast.success("Copied — the AM sends it, in their own voice");
          }}
        >
          <Copy className="mr-1 h-3 w-3" /> Copy
        </Button>
      </div>
      <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} className="text-sm" />
      <p className="text-xs text-muted-foreground">
        Never auto-sent. The system drafts; the account manager edits and sends — outreach to a live client relationship
        always stays human.
      </p>
    </div>
  );
}
