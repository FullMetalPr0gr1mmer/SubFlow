"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const chartHeight = 260;

const PLAN_COLORS: Record<string, string> = {
  Starter: "#0EA5E9",
  Professional: "#2563EB",
  Enterprise: "#6366F1",
};

const INTERVAL_COLORS: Record<string, string> = {
  monthly: "#2563EB",
  quarterly: "#0EA5E9",
};

function monthLabel(key: string) {
  const [, m] = key.split("-");
  return new Date(2000, parseInt(m, 10) - 1, 1).toLocaleString("en-US", { month: "short" });
}

const tooltipStyle = {
  background: "white",
  border: "1px solid #E2E8F0",
  borderRadius: 12,
  padding: "8px 12px",
  fontSize: 12,
};

export function SubscriberGrowthChart({ data }: { data: { month: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <AreaChart data={data} margin={{ top: 10, right: 12, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="growthFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#2563EB" stopOpacity={0.35} />
            <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
        <XAxis
          dataKey="month"
          tickFormatter={monthLabel}
          stroke="#94A3B8"
          tick={{ fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis stroke="#94A3B8" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`${v} new`, "Subscribers"]} />
        <Area
          type="monotone"
          dataKey="count"
          stroke="#2563EB"
          strokeWidth={2.5}
          fill="url(#growthFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function RevenueChart({ data }: { data: { month: string; revenue: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <BarChart data={data} margin={{ top: 10, right: 12, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
        <XAxis
          dataKey="month"
          tickFormatter={monthLabel}
          stroke="#94A3B8"
          tick={{ fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          stroke="#94A3B8"
          tick={{ fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => `$${(v / 100000).toFixed(1)}K`}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(v: any) => [`$${(v / 100).toLocaleString()}`, "Revenue"]}
        />
        <Bar dataKey="revenue" fill="#2563EB" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function PlanDistributionChart({ data }: { data: { plan: string; count: number }[] }) {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={chartHeight}>
        <PieChart>
          <Pie data={data} dataKey="count" nameKey="plan" innerRadius={70} outerRadius={100} paddingAngle={3}>
            {data.map((d) => (
              <Cell key={d.plan} fill={PLAN_COLORS[d.plan] || "#94A3B8"} />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} formatter={(v: any, name: any) => [v, name]} />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <p className="font-display text-3xl font-semibold tracking-tight">{total}</p>
        <p className="text-xs uppercase tracking-wide text-ink-muted">Active</p>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs">
        {data.map((d) => (
          <span key={d.plan} className="inline-flex items-center gap-2 text-ink-muted">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: PLAN_COLORS[d.plan] || "#94A3B8" }}
            />
            {d.plan} <span className="text-ink">{d.count}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export function BillingSplitChart({ data }: { data: { interval: string; count: number }[] }) {
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={chartHeight}>
        <PieChart>
          <Pie data={data} dataKey="count" nameKey="interval" innerRadius={70} outerRadius={100} paddingAngle={3}>
            {data.map((d) => (
              <Cell key={d.interval} fill={INTERVAL_COLORS[d.interval] || "#94A3B8"} />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} formatter={(v: any, name: any) => [v, name]} />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs capitalize">
        {data.map((d) => (
          <span key={d.interval} className="inline-flex items-center gap-2 text-ink-muted">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: INTERVAL_COLORS[d.interval] || "#94A3B8" }}
            />
            {d.interval} <span className="text-ink">{d.count}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
