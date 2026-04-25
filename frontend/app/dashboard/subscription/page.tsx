"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeftRight, ExternalLink, XCircle } from "lucide-react";
import { Badge, statusBadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import api from "@/lib/api";
import type { Subscription } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function SubscriptionPage() {
  const { push } = useToast();
  const [subscription, setSubscription] = useState<Subscription | null | undefined>(undefined);
  const [portalLoading, setPortalLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  useEffect(() => {
    api
      .get<Subscription | null>("/subscriptions/current")
      .then((res) => setSubscription(res.data))
      .catch(() => {
        push({ kind: "error", title: "Could not load subscription" });
        setSubscription(null);
      });
  }, [push]);

  async function openPortal() {
    push({
      kind: "default",
      title: "Billing portal (demo)",
      description: "Stripe billing portal is disabled in demo mode.",
    });
  }

  async function cancelSubscription() {
    try {
      setCancelLoading(true);
      await api.post("/subscriptions/cancel");
      push({ kind: "success", title: "Subscription canceled" });
      window.location.href = "/dashboard";
    } catch (e: any) {
      push({
        kind: "error",
        title: "Could not cancel",
        description: e?.response?.data?.detail || e?.message,
      });
      setCancelLoading(false);
    }
  }

  const periodProgress = useMemo(() => {
    if (!subscription?.current_period_start || !subscription?.current_period_end) return 0;
    const start = new Date(subscription.current_period_start).getTime();
    const end = new Date(subscription.current_period_end).getTime();
    const now = Date.now();
    if (end <= start) return 0;
    return Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
  }, [subscription]);

  if (subscription === undefined) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  if (!subscription) {
    return (
      <EmptyState
        icon={ArrowLeftRight}
        title="No active subscription"
        description="Pick a plan to start managing your billing here."
        action={
          <Button asChild>
            <Link href="/dashboard/plans">View plans</Link>
          </Button>
        }
      />
    );
  }

  const plan = subscription.plan;
  const priceCents =
    subscription.billing_interval === "monthly"
      ? plan?.monthly_price ?? 0
      : plan?.quarterly_price ?? 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="border-b border-slate-100">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-3">
                <CardTitle className="font-display text-2xl">{plan?.name ?? "Your plan"}</CardTitle>
                <Badge variant={statusBadgeVariant(subscription.status)}>{subscription.status}</Badge>
              </div>
              <p className="mt-1 text-sm text-ink-muted">{plan?.description}</p>
            </div>
            <div className="text-right">
              <p className="font-display text-2xl font-semibold tracking-tight">
                {formatCurrency(priceCents)}
              </p>
              <p className="text-xs uppercase tracking-wide text-ink-muted">
                per {subscription.billing_interval === "monthly" ? "month" : "quarter"}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          <div>
            <div className="flex items-center justify-between text-sm text-ink-muted">
              <span>Current period</span>
              <span>
                {formatDate(subscription.current_period_start)} → {formatDate(subscription.current_period_end)}
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full bg-gradient-to-r from-brand to-accent transition-all"
                style={{ width: `${periodProgress}%` }}
              />
            </div>
          </div>

          <dl className="grid gap-4 sm:grid-cols-3">
            <DetailItem label="Billing interval" value={subscription.billing_interval} />
            <DetailItem label="Started" value={formatDate(subscription.created_at)} />
            <DetailItem label="Renews" value={formatDate(subscription.current_period_end)} />
          </dl>

          {subscription.cancel_at_period_end && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Your plan will remain active until{" "}
              <strong>{formatDate(subscription.current_period_end)}</strong>, then it will be canceled.
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <Button onClick={openPortal} disabled={portalLoading}>
              <ExternalLink className="h-4 w-4" /> Manage billing
            </Button>
            <Button asChild variant="secondary">
              <Link href="/dashboard/plans">Change plan</Link>
            </Button>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="text-danger hover:bg-red-50 hover:text-danger">
                  <XCircle className="h-4 w-4" /> Cancel subscription
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Cancel your subscription?</DialogTitle>
                  <DialogDescription>
                    The plan will be marked canceled immediately and you'll return to the dashboard.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="ghost">Keep plan</Button>
                  </DialogClose>
                  <Button variant="destructive" onClick={cancelSubscription} disabled={cancelLoading}>
                    {cancelLoading ? "Canceling…" : "Yes, cancel"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/40 p-4">
      <dt className="text-xs uppercase tracking-wide text-ink-muted">{label}</dt>
      <dd className="mt-1 text-sm font-medium capitalize text-ink">{value || "—"}</dd>
    </div>
  );
}
