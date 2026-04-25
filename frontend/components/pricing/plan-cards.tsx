"use client";

import { useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatCurrency } from "@/lib/utils";
import type { BillingInterval, Plan } from "@/lib/types";

interface PlanCardsProps {
  plans: Plan[] | null;
  loading?: boolean;
  currentPlanId?: string | null;
  onSelect?: (plan: Plan, interval: BillingInterval) => void;
  ctaLabel?: (plan: Plan) => string;
  selectingPlanId?: string | null;
}

const popularPlan = "Professional";

export function PlanCards({
  plans,
  loading,
  currentPlanId,
  onSelect,
  ctaLabel,
  selectingPlanId,
}: PlanCardsProps) {
  const [interval, setInterval] = useState<BillingInterval>("monthly");

  return (
    <div className="space-y-10">
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-1 rounded-xl border border-border bg-white p-1 shadow-card">
          {(["monthly", "quarterly"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setInterval(k)}
              className={cn(
                "relative rounded-lg px-5 py-2 text-sm font-medium capitalize transition-all",
                interval === k ? "bg-brand text-white shadow-sm" : "text-ink-muted hover:text-ink",
              )}
            >
              {k}
              {k === "quarterly" && (
                <span
                  className={cn(
                    "ml-2 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                    interval === k ? "bg-white/20 text-white" : "bg-emerald-50 text-emerald-700",
                  )}
                >
                  Save ~10%
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {loading && !plans
          ? Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-[520px] w-full" />
            ))
          : (plans || []).map((plan) => {
              const isPopular = plan.name === popularPlan;
              const isCurrent = currentPlanId === plan.id;
              const priceCents = interval === "monthly" ? plan.monthly_price : plan.quarterly_price;
              const monthlyEquivCents =
                interval === "quarterly" ? Math.round(plan.quarterly_price / 3) : plan.monthly_price;

              return (
                <Card
                  key={plan.id}
                  className={cn(
                    "relative flex flex-col p-8 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover",
                    isPopular && "border-brand/60 shadow-card-hover ring-1 ring-brand/20",
                  )}
                >
                  {isPopular && (
                    <span className="absolute -top-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-brand px-3 py-1 text-xs font-semibold text-white shadow">
                      <Sparkles className="h-3 w-3" /> Most popular
                    </span>
                  )}

                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-xl font-semibold">{plan.name}</h3>
                    {isCurrent && <Badge variant="success">Current plan</Badge>}
                  </div>
                  <p className="mt-2 text-sm text-ink-muted">{plan.description}</p>

                  <div className="mt-8 flex items-baseline gap-1">
                    <span className="font-display text-5xl font-semibold tracking-tight">
                      {formatCurrency(monthlyEquivCents)}
                    </span>
                    <span className="text-sm text-ink-muted">/mo</span>
                  </div>
                  <p className="mt-1 text-xs text-ink-muted">
                    {interval === "quarterly"
                      ? `${formatCurrency(priceCents)} billed every 3 months`
                      : `${formatCurrency(priceCents)} billed monthly`}
                  </p>

                  <ul className="mt-8 space-y-3 text-sm">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-3 text-ink">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto pt-8">
                    <Button
                      className="w-full"
                      variant={isPopular ? "default" : "secondary"}
                      disabled={isCurrent || selectingPlanId === plan.id}
                      onClick={() => onSelect?.(plan, interval)}
                    >
                      {selectingPlanId === plan.id
                        ? "Redirecting…"
                        : isCurrent
                          ? "Current plan"
                          : ctaLabel
                            ? ctaLabel(plan)
                            : "Get started"}
                    </Button>
                  </div>
                </Card>
              );
            })}
      </div>
    </div>
  );
}
