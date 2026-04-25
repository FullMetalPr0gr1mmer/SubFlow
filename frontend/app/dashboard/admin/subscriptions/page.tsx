"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge, statusBadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import api from "@/lib/api";
import type { Subscription } from "@/lib/types";
import { formatCurrency, formatDate, initials } from "@/lib/utils";

interface AdminSub extends Omit<Subscription, "plan"> {
  user: { full_name: string; email: string; avatar_url: string | null } | null;
  plan: { name: string; monthly_price: number; quarterly_price: number } | null;
}

interface Resp {
  items: AdminSub[];
  total: number;
  page: number;
  per_page: number;
  summary: { active: number; canceled: number; past_due: number };
}

const STATUS_OPTIONS = ["", "active", "trialing", "past_due", "canceled", "expired"];
const PLAN_OPTIONS = ["", "Starter", "Professional", "Enterprise"];
const INTERVAL_OPTIONS = ["", "monthly", "quarterly"];

export default function AdminSubscriptionsPage() {
  const { push } = useToast();
  const [data, setData] = useState<Resp | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [planFilter, setPlanFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [intervalFilter, setIntervalFilter] = useState("");

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), per_page: "20" });
    if (planFilter) params.set("plan_filter", planFilter);
    if (statusFilter) params.set("status_filter", statusFilter);
    if (intervalFilter) params.set("interval_filter", intervalFilter);
    api
      .get<Resp>(`/admin/subscriptions?${params.toString()}`)
      .then((res) => setData(res.data))
      .catch(() => push({ kind: "error", title: "Could not load subscriptions" }))
      .finally(() => setLoading(false));
  }, [page, planFilter, statusFilter, intervalFilter, push]);

  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / 20));

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4 text-center">
          <p className="text-xs uppercase tracking-wide text-ink-muted">Active</p>
          <p className="mt-1 font-display text-2xl font-semibold text-emerald-600">
            {data?.summary.active ?? 0}
          </p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xs uppercase tracking-wide text-ink-muted">Canceled</p>
          <p className="mt-1 font-display text-2xl font-semibold text-amber-600">
            {data?.summary.canceled ?? 0}
          </p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xs uppercase tracking-wide text-ink-muted">Past due</p>
          <p className="mt-1 font-display text-2xl font-semibold text-danger">
            {data?.summary.past_due ?? 0}
          </p>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <FilterSelect label="Plan" value={planFilter} onChange={(v) => { setPage(1); setPlanFilter(v); }} options={PLAN_OPTIONS} />
          <FilterSelect label="Status" value={statusFilter} onChange={(v) => { setPage(1); setStatusFilter(v); }} options={STATUS_OPTIONS} />
          <FilterSelect label="Interval" value={intervalFilter} onChange={(v) => { setPage(1); setIntervalFilter(v); }} options={INTERVAL_OPTIONS} />
        </div>
      </Card>

      <Card>
        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Interval</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Started</TableHead>
                <TableHead>Renews</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data?.items ?? []).map((s) => {
                const amount =
                  s.billing_interval === "monthly"
                    ? s.plan?.monthly_price ?? 0
                    : s.plan?.quarterly_price ?? 0;
                return (
                  <TableRow key={s.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          {s.user?.avatar_url && <AvatarImage src={s.user.avatar_url} alt={s.user.full_name} />}
                          <AvatarFallback>{initials(s.user?.full_name, s.user?.email)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{s.user?.full_name || "—"}</p>
                          <p className="text-xs text-ink-muted">{s.user?.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{s.plan?.name ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={statusBadgeVariant(s.status)}>{s.status}</Badge>
                    </TableCell>
                    <TableCell className="capitalize">{s.billing_interval}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(amount)}</TableCell>
                    <TableCell>{formatDate(s.created_at)}</TableCell>
                    <TableCell>{formatDate(s.current_period_end)}</TableCell>
                  </TableRow>
                );
              })}
              {(data?.items ?? []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-sm text-ink-muted">
                    No subscriptions match these filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      <div className="flex items-center justify-between text-sm text-ink-muted">
        <p>Page {page} of {totalPages} · {data?.total ?? 0} subscriptions</p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            <ChevronLeft className="h-4 w-4" /> Prev
          </Button>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <label className="inline-flex items-center gap-2 text-sm text-ink-muted">
      <span className="hidden sm:inline">{label}:</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 rounded-xl border border-border bg-white px-3 text-sm text-ink shadow-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt || `All ${label.toLowerCase()}s`}
          </option>
        ))}
      </select>
    </label>
  );
}
