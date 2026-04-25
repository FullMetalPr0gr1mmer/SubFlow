import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  delta?: string;
  accent?: "blue" | "emerald" | "violet" | "amber";
}

const accents: Record<NonNullable<StatCardProps["accent"]>, string> = {
  blue: "from-brand/10 via-white to-brand/5 text-brand",
  emerald: "from-emerald-100 via-white to-emerald-50 text-emerald-600",
  violet: "from-violet-100 via-white to-violet-50 text-violet-600",
  amber: "from-amber-100 via-white to-amber-50 text-amber-600",
};

export function StatCard({ icon: Icon, label, value, delta, accent = "blue" }: StatCardProps) {
  return (
    <Card className={cn("relative overflow-hidden p-6")}>
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-90", accents[accent])} aria-hidden />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-ink-muted">{label}</p>
          <p className="mt-2 font-display text-3xl font-semibold tracking-tight">{value}</p>
          {delta && <p className="mt-1 text-xs font-medium text-ink-muted">{delta}</p>}
        </div>
        <span className={cn("flex h-11 w-11 items-center justify-center rounded-xl bg-white/70 shadow-card backdrop-blur")}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </Card>
  );
}
