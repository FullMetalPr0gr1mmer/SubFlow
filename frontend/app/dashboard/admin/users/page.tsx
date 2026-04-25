"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal, Search, ShieldCheck, ShieldOff } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge, statusBadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { useUser } from "@/components/dashboard/user-context";
import api from "@/lib/api";
import { formatDate, initials } from "@/lib/utils";

interface AdminUser {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  is_admin: boolean;
  created_at: string;
  plan_name: string | null;
  status: string | null;
  billing_interval: string | null;
}

interface Resp {
  items: AdminUser[];
  total: number;
  page: number;
  per_page: number;
}

const PLAN_OPTIONS = ["", "Starter", "Professional", "Enterprise"];
const STATUS_OPTIONS = ["", "active", "trialing", "past_due", "canceled", "expired"];

export default function AdminUsersPage() {
  const { push } = useToast();
  const { profile: actor } = useUser();
  const [data, setData] = useState<Resp | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [pendingSearch, setPendingSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [refreshTick, setRefreshTick] = useState(0);
  const [pendingRoleChange, setPendingRoleChange] = useState<AdminUser | null>(null);
  const [savingRole, setSavingRole] = useState(false);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), per_page: "20" });
    if (search) params.set("search", search);
    if (planFilter) params.set("plan_filter", planFilter);
    if (statusFilter) params.set("status_filter", statusFilter);
    api
      .get<Resp>(`/admin/users?${params.toString()}`)
      .then((res) => setData(res.data))
      .catch(() => push({ kind: "error", title: "Could not load users" }))
      .finally(() => setLoading(false));
  }, [page, search, planFilter, statusFilter, push, refreshTick]);

  async function confirmRoleChange() {
    if (!pendingRoleChange) return;
    const target = pendingRoleChange;
    const next = !target.is_admin;
    setSavingRole(true);
    try {
      await api.post(`/admin/users/${target.id}/admin-role`, { is_admin: next });
      push({
        kind: "success",
        title: next ? "Admin granted" : "Admin revoked",
        description: target.full_name || target.email,
      });
      setPendingRoleChange(null);
      setRefreshTick((t) => t + 1);
    } catch (e: any) {
      push({
        kind: "error",
        title: "Could not update role",
        description: e?.response?.data?.detail || e?.message,
      });
    } finally {
      setSavingRole(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / 20));

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            setSearch(pendingSearch);
          }}
          className="flex flex-wrap items-center gap-3"
        >
          <div className="relative flex-1 min-w-[220px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
            <Input
              placeholder="Search name or email…"
              value={pendingSearch}
              onChange={(e) => setPendingSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <FilterSelect
            label="Plan"
            value={planFilter}
            onChange={(v) => {
              setPage(1);
              setPlanFilter(v);
            }}
            options={PLAN_OPTIONS}
          />
          <FilterSelect
            label="Status"
            value={statusFilter}
            onChange={(v) => {
              setPage(1);
              setStatusFilter(v);
            }}
            options={STATUS_OPTIONS}
          />
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>
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
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Billing</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="w-12 text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data?.items ?? []).map((u) => {
                const isSelf = u.id === actor.id;
                return (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          {u.avatar_url && <AvatarImage src={u.avatar_url} alt={u.full_name} />}
                          <AvatarFallback>{initials(u.full_name, u.email)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{u.full_name || "—"}</p>
                          {u.is_admin && (
                            <span className="text-[10px] font-semibold uppercase tracking-wide text-brand">
                              Admin
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-ink-muted">{u.email}</TableCell>
                    <TableCell>{u.plan_name ?? <span className="text-ink-muted">—</span>}</TableCell>
                    <TableCell>
                      {u.status ? (
                        <Badge variant={statusBadgeVariant(u.status)}>{u.status}</Badge>
                      ) : (
                        <span className="text-ink-muted">—</span>
                      )}
                    </TableCell>
                    <TableCell className="capitalize">{u.billing_interval ?? "—"}</TableCell>
                    <TableCell>{formatDate(u.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={isSelf}
                            aria-label="Row actions"
                            title={isSelf ? "You can't change your own role" : "Actions"}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => setPendingRoleChange(u)}>
                            {u.is_admin ? (
                              <>
                                <ShieldOff className="h-4 w-4" /> Revoke admin
                              </>
                            ) : (
                              <>
                                <ShieldCheck className="h-4 w-4" /> Make admin
                              </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
              {(data?.items ?? []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-sm text-ink-muted">
                    No users match these filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      <div className="flex items-center justify-between text-sm text-ink-muted">
        <p>
          Page {page} of {totalPages} · {data?.total ?? 0} users
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            <ChevronLeft className="h-4 w-4" /> Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Dialog
        open={pendingRoleChange !== null}
        onOpenChange={(open) => !open && !savingRole && setPendingRoleChange(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pendingRoleChange?.is_admin ? "Revoke admin access?" : "Grant admin access?"}
            </DialogTitle>
            <DialogDescription>
              {pendingRoleChange?.is_admin
                ? `${pendingRoleChange.full_name || pendingRoleChange.email} will lose access to admin pages and actions.`
                : `${pendingRoleChange?.full_name || pendingRoleChange?.email} will get full admin access — including the ability to grant or revoke admin from other users.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost" disabled={savingRole}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              variant={pendingRoleChange?.is_admin ? "destructive" : "default"}
              onClick={confirmRoleChange}
              disabled={savingRole}
            >
              {savingRole
                ? "Saving…"
                : pendingRoleChange?.is_admin
                  ? "Yes, revoke"
                  : "Yes, make admin"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
