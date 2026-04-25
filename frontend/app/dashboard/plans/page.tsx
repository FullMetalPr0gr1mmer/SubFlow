"use client";

import { useEffect, useState } from "react";
import { PlanCards } from "@/components/pricing/plan-cards";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { useUser } from "@/components/dashboard/user-context";
import api from "@/lib/api";
import type { Plan } from "@/lib/types";

export default function DashboardPlansPage() {
  const { subscription } = useUser();
  const { push } = useToast();
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectingPlanId, setSelectingPlanId] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<Plan[]>("/plans")
      .then((res) => setPlans(res.data))
      .catch(() => push({ kind: "error", title: "Could not load plans" }))
      .finally(() => setLoading(false));
  }, [push]);

  async function onSelect(plan: Plan, interval: "monthly" | "quarterly") {
    try {
      setSelectingPlanId(plan.id);
      await api.post("/subscriptions/subscribe", {
        plan_id: plan.id,
        billing_interval: interval,
      });
      push({
        kind: "success",
        title: `Subscribed to ${plan.name}`,
        description: "Your dashboard has been updated.",
      });
      window.location.href = "/dashboard/checkout/success";
    } catch (e: any) {
      push({
        kind: "error",
        title: "Subscribe failed",
        description: e?.response?.data?.detail || e?.message,
      });
      setSelectingPlanId(null);
    }
  }

  function ctaLabel(plan: Plan) {
    if (!subscription || !subscription.plan) return "Subscribe";
    const currentPrice = subscription.plan.monthly_price;
    return plan.monthly_price > currentPrice ? "Upgrade" : "Downgrade";
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Choose your plan</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Switch tiers or billing intervals at any time. Changes take effect immediately.
        </p>
      </header>
      {loading && !plans ? (
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-[520px]" />
          <Skeleton className="h-[520px]" />
          <Skeleton className="h-[520px]" />
        </div>
      ) : (
        <PlanCards
          plans={plans}
          loading={loading}
          currentPlanId={subscription?.plan_id ?? null}
          selectingPlanId={selectingPlanId}
          ctaLabel={ctaLabel}
          onSelect={onSelect}
        />
      )}
    </div>
  );
}
