import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-brand/10 text-brand",
        success: "bg-emerald-50 text-emerald-700",
        warning: "bg-amber-50 text-amber-700",
        danger: "bg-red-50 text-red-700",
        muted: "bg-slate-100 text-ink-muted",
        outline: "border border-border text-ink-muted",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export function statusBadgeVariant(status?: string | null) {
  switch (status) {
    case "active":
    case "paid":
      return "success" as const;
    case "trialing":
    case "pending":
      return "warning" as const;
    case "past_due":
    case "failed":
      return "danger" as const;
    case "canceled":
      return "warning" as const;
    case "expired":
      return "muted" as const;
    default:
      return "muted" as const;
  }
}
