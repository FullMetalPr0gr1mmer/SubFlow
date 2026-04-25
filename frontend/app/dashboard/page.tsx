"use client";

import Link from "next/link";
import { ArrowRight, CreditCard, CalendarCheck, Wallet, LifeBuoy, Receipt, Sparkles } from "lucide-react";
import { Badge, statusBadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { useUser } from "@/components/dashboard/user-context";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function DashboardOverview() {
  const { profile, subscription } = useUser();

  const firstName = profile.full_name?.split(" ")[0] || "there";

  if (!subscription) {
    return (
      <div className="space-y-8">
        <header>
          <p className="text-sm text-ink-muted">Welcome back,</p>
          <h1 className="font-display text-3xl font-semibold tracking-tight">{firstName}</h1>
        </header>
        <EmptyState
          icon={Sparkles}
          title="Choose a plan to get started"
          description="Pick a tier that matches your team's size. You can upgrade or downgrade at any time."
          action={
            <Button asChild size="lg">
              <Link href="/dashboard/plans">
                View plans <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          }
        />
      </div>
    );
  }

  const plan = subscription.plan;
  const priceCents =
    subscription.billing_interval === "monthly"
      ? plan?.monthly_price ?? 0
      : plan?.quarterly_price ?? 0;

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-ink-muted">Welcome back,</p>
          <h1 className="font-display text-3xl font-semibold tracking-tight">{firstName}</h1>
        </div>
        <Button asChild variant="secondary">
          <Link href="/dashboard/plans">Change plan</Link>
        </Button>
      </header>

      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-brand/5 via-white to-accent/5 p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <Badge variant={statusBadgeVariant(subscription.status)}>
                  {subscription.status}
                </Badge>
                <span className="text-xs uppercase tracking-wide text-ink-muted">
                  {subscription.billing_interval}
                </span>
              </div>
              <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight">
                {plan?.name ?? "Active plan"}
              </h2>
              <p className="mt-2 max-w-md text-sm text-ink-muted">{plan?.description}</p>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-card">
              <p className="text-xs uppercase tracking-wide text-ink-muted">Next billing</p>
              <p className="mt-1 font-display text-2xl font-semibold">
                {formatDate(subscription.current_period_end)}
              </p>
              <p className="mt-1 text-sm text-ink-muted">
                {formatCurrency(priceCents)} {subscription.billing_interval === "monthly" ? "per month" : "per quarter"}
              </p>
            </div>
          </div>

          {subscription.cancel_at_period_end && (
            <div className="mt-6 rounded-xl border border-amber-200/60 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Your plan is scheduled to cancel at the end of the current period ({formatDate(subscription.current_period_end)}).
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/dashboard/subscription">Manage subscription</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/dashboard/invoices">View invoices</Link>
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={<CreditCard className="h-5 w-5" />}
          label="Current plan"
          value={plan?.name ?? "—"}
          accent="from-brand/10 to-brand/5 text-brand"
        />
        <StatCard
          icon={<CalendarCheck className="h-5 w-5" />}
          label="Next payment"
          value={formatDate(subscription.current_period_end)}
          accent="from-emerald-100 to-emerald-50 text-emerald-600"
        />
        <StatCard
          icon={<Wallet className="h-5 w-5" />}
          label="Amount"
          value={formatCurrency(priceCents)}
          accent="from-accent/10 to-accent/5 text-accent"
        />
      </div>

      <section>
        <h2 className="font-display text-lg font-semibold tracking-tight">Quick actions</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          <QuickAction
            icon={<Receipt className="h-5 w-5" />}
            title="View invoices"
            description="Download receipts and check payment status."
            href="/dashboard/invoices"
          />
          <QuickAction
            icon={<CreditCard className="h-5 w-5" />}
            title="Change plan"
            description="Upgrade or downgrade in a few clicks."
            href="/dashboard/plans"
          />
          <QuickAction
            icon={<LifeBuoy className="h-5 w-5" />}
            title="Get support"
            description="Open the AI assistant or contact the team."
            href="#"
            hintOnClick="Open the chat bubble in the bottom-right."
          />
        </div>
      </section>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <Card className="p-6">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${accent}`}>
        {icon}
      </div>
      <p className="mt-4 text-xs uppercase tracking-wide text-ink-muted">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold tracking-tight">{value}</p>
    </Card>
  );
}

function QuickAction({
  icon,
  title,
  description,
  href,
  hintOnClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  hintOnClick?: string;
}) {
  const content = (
    <Card className="group h-full cursor-pointer p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">{icon}</div>
      <CardHeader className="p-0 pt-4">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="px-0 pt-3">
        <span className="inline-flex items-center gap-1 text-xs font-medium text-brand">
          Open <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
        </span>
      </CardContent>
    </Card>
  );

  if (hintOnClick) {
    return (
      <button
        type="button"
        onClick={() => alert(hintOnClick)}
        className="text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 rounded-2xl"
      >
        {content}
      </button>
    );
  }

  return <Link href={href}>{content}</Link>;
}
