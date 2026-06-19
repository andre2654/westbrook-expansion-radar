import { cn } from "@/lib/utils";

export function GlassCard({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("glass", className)}>{children}</div>;
}

export function Crest({ name, className }: { name: string; className?: string }) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <div
      className={cn(
        "crest flex shrink-0 items-center justify-center rounded-xl font-bold tracking-tight text-white",
        className
      )}
    >
      {initials}
    </div>
  );
}
