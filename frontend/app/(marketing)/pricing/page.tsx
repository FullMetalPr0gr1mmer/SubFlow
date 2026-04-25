"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PlanCards } from "@/components/pricing/plan-cards";
import { useToast } from "@/components/ui/toast";
import api from "@/lib/api";
import { createClient } from "@/lib/supabase/client";
import type { Plan } from "@/lib/types";

export default function PricingPage() {
  const router = useRouter();
  const { push } = useToast();
  const supabase = createClient();

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
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      router.push(`/register`);
      return;
    }
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

  return (
    <div className="mx-auto max-w-7xl px-6 py-20">
      <div className="mx-auto max-w-2xl text-center animate-fade-in">
        <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
          Simple, transparent pricing.
        </h1>
        <p className="mt-4 text-base text-ink-muted">
          Start on Starter, upgrade when your team grows. No hidden fees, no per-seat surprises.
        </p>
      </div>
      <div className="mt-14">
        <PlanCards plans={plans} loading={loading} selectingPlanId={selectingPlanId} onSelect={onSelect} />
      </div>
    </div>
  );
}
