"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Receipt, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge, statusBadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import api from "@/lib/api";
import type { Invoice } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";

interface PaginatedResp {
  items: Invoice[];
  total: number;
  page: number;
  per_page: number;
}

export default function InvoicesPage() {
  const { push } = useToast();
  const [data, setData] = useState<PaginatedResp | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const perPage = 10;

  useEffect(() => {
    setLoading(true);
    api
      .get<PaginatedResp>(`/invoices?page=${page}&per_page=${perPage}`)
      .then((res) => setData(res.data))
      .catch(() => push({ kind: "error", title: "Could not load invoices" }))
      .finally(() => setLoading(false));
  }, [page, push]);

  if (loading && !data) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  const items = data?.items ?? [];

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Receipt}
        title="No invoices yet"
        description="Once you subscribe to a plan, your invoices and receipts will appear here."
        action={
          <Button asChild>
            <Link href="/dashboard/plans">Subscribe to a plan</Link>
          </Button>
        }
      />
    );
  }

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div className="space-y-6">
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Invoice #</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((inv) => (
              <TableRow key={inv.id}>
                <TableCell className="font-medium">{formatDate(inv.invoice_date)}</TableCell>
                <TableCell className="text-ink-muted">
                  <span className="font-mono text-xs">
                    {inv.stripe_invoice_id ? inv.stripe_invoice_id.slice(-12) : inv.id.slice(0, 8)}
                  </span>
                </TableCell>
                <TableCell>{inv.subscription?.plan?.name ?? "—"}</TableCell>
                <TableCell className="font-medium">
                  {formatCurrency(inv.amount, inv.currency.toUpperCase())}
                </TableCell>
                <TableCell>
                  <Badge variant={statusBadgeVariant(inv.status)}>{inv.status}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <div className="flex items-center justify-between text-sm text-ink-muted">
        <p>
          Page {page} of {totalPages} · {total} invoice{total === 1 ? "" : "s"}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
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
    </div>
  );
}
