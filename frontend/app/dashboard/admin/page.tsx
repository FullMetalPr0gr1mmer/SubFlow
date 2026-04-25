"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  DollarSign,
  TrendingDown,
  Users,
} from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatCard } from "@/components/admin/stat-card";
import {
  BillingSplitChart,
  PlanDistributionChart,
  RevenueChart,
  SubscriberGrowthChart,
} from "@/components/admin/charts";
import { useUser } from "@/components/dashboard/user-context";
import api from "@/lib/api";
import { formatCurrency, formatDate, initials } from "@/lib/utils";

interface Stats {
  total_users: number;
  active_subscriptions: number;
  mrr: number;
  churn_rate: number;
}

interface ActivityItem {
  kind: "signup" | "subscription";
  at: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  detail: string;
}

export default function AdminDashboard() {
  const { profile } = useUser();
  const { push } = useToast();

  const [stats, setStats] = useState<Stats | null>(null);
  const [growth, setGrowth] = useState<{ month: string; count: number }[]>([]);
  const [revenue, setRevenue] = useState<{ month: string; revenue: number }[]>([]);
  const [planDist, setPlanDist] = useState<{ plan: string; count: number }[]>([]);
  const [billing, setBilling] = useState<{ interval: string; count: number }[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile.is_admin) return;
    Promise.all([
      api.get<Stats>("/admin/stats"),
      api.get<typeof growth>("/admin/charts/subscriber-growth"),
      api.get<typeof revenue>("/admin/charts/revenue"),
      api.get<typeof planDist>("/admin/charts/plan-distribution"),
      api.get<typeof billing>("/admin/charts/billing-split"),
      api.get<ActivityItem[]>("/admin/recent-activity"),
    ])
      .then(([s, g, r, pd, b, a]) => {
        setStats(s.data);
        setGrowth(g.data);
        setRevenue(r.data);
        setPlanDist(pd.data);
        setBilling(b.data);
        setActivity(a.data);
      })
      .catch(() => push({ kind: "error", title: "Could not load admin data" }))
      .finally(() => setLoading(false));
  }, [profile.is_admin, push]);

  if (!profile.is_admin) {
    return <div className="text-sm text-ink-muted">Admin access required.</div>;
  }

  if (loading || !stats) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users} label="Total users" value={stats.total_users.toLocaleString()} accent="blue" />
        <StatCard
          icon={BarChart3}
          label="Active subscriptions"
          value={stats.active_subscriptions.toLocaleString()}
          accent="emerald"
        />
        <StatCard icon={DollarSign} label="MRR" value={formatCurrency(stats.mrr)} accent="violet" />
        <StatCard
          icon={TrendingDown}
          label="Churn (30d)"
          value={`${stats.churn_rate.toFixed(1)}%`}
          accent="amber"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Subscriber growth</CardTitle>
            <CardDescription>New subscriptions per month, last 8 months.</CardDescription>
          </CardHeader>
          <div className="px-2 pb-4">
            <SubscriberGrowthChart data={growth} />
          </div>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Revenue trend</CardTitle>
            <CardDescription>Paid invoices per month.</CardDescription>
          </CardHeader>
          <div className="px-2 pb-4">
            <RevenueChart data={revenue} />
          </div>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Plan distribution</CardTitle>
            <CardDescription>Active subscribers by tier.</CardDescription>
          </CardHeader>
          <div className="px-6 pb-6">
            <PlanDistributionChart data={planDist} />
          </div>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Billing interval split</CardTitle>
            <CardDescription>Monthly vs quarterly active subscribers.</CardDescription>
          </CardHeader>
          <div className="px-6 pb-6">
            <BillingSplitChart data={billing} />
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
          <CardDescription>Latest signups and subscription changes.</CardDescription>
        </CardHeader>
        <ul className="divide-y divide-slate-100">
          {activity.length === 0 && (
            <li className="px-6 py-6 text-sm text-ink-muted">No activity yet.</li>
          )}
          {activity.map((item, idx) => (
            <li key={idx} className="flex items-center gap-4 px-6 py-4">
              <Avatar className="h-9 w-9">
                {item.avatar_url && <AvatarImage src={item.avatar_url} alt={item.full_name || ""} />}
                <AvatarFallback>{initials(item.full_name, item.email)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm">
                  <span className="font-medium text-ink">{item.full_name || item.email || "Someone"}</span>{" "}
                  <span className="text-ink-muted">{item.detail}</span>
                </p>
                <p className="text-xs text-ink-muted">{formatDate(item.at, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</p>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
