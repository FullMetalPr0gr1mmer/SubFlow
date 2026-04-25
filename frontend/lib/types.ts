export type BillingInterval = "monthly" | "quarterly";
export type SubscriptionStatus =
  | "active"
  | "canceled"
  | "past_due"
  | "trialing"
  | "expired";
export type InvoiceStatus = "paid" | "pending" | "failed";

export interface Plan {
  id: string;
  name: string;
  description: string;
  features: string[];
  monthly_price: number;
  quarterly_price: number;
  stripe_monthly_price_id?: string | null;
  stripe_quarterly_price_id?: string | null;
  is_active: boolean;
  sort_order: number;
}

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  is_admin: boolean;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  billing_interval: BillingInterval;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  plan?: Plan | null;
}

export interface Invoice {
  id: string;
  subscription_id: string | null;
  user_id: string;
  stripe_invoice_id: string | null;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  invoice_date: string;
  paid_at: string | null;
  subscription?: { plan?: { name: string } | null } | null;
}

export interface MeResponse {
  profile: Profile;
  subscription: Subscription | null;
}
