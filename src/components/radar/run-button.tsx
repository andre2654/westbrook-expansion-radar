"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export function RunButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          const res = await fetch("/api/run-radar", { method: "POST" });
          if (!res.ok) throw new Error();
          toast.success("Weekly radar re-run");
          router.refresh();
        } catch {
          toast.error("Run failed");
        } finally {
          setBusy(false);
        }
      }}
    >
      <RefreshCw className={cn("mr-2 h-4 w-4", busy && "animate-spin")} />
      Re-run weekly radar
    </Button>
  );
}
