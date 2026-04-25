-- =====================================================================
-- SubFlow — Supabase schema
-- Run this file in Supabase SQL Editor (or via `supabase db push`).
-- Safe to re-run: uses IF NOT EXISTS / CREATE OR REPLACE where possible.
-- =====================================================================

create extension if not exists "pgcrypto";

-- =====================================================================
-- Tables
-- =====================================================================

create table if not exists public.profiles (
    id          uuid primary key references auth.users(id) on delete cascade,
    full_name   text not null default '',
    email       text not null,
    avatar_url  text,
    is_admin    boolean not null default false,
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now()
);

create table if not exists public.plans (
    id                          uuid primary key default gen_random_uuid(),
    name                        text not null,
    description                 text not null default '',
    features                    jsonb not null default '[]'::jsonb,
    monthly_price               integer not null,
    quarterly_price             integer not null,
    stripe_monthly_price_id     text,
    stripe_quarterly_price_id   text,
    is_active                   boolean not null default true,
    sort_order                  integer not null default 0,
    created_at                  timestamptz not null default now()
);

create table if not exists public.subscriptions (
    id                      uuid primary key default gen_random_uuid(),
    user_id                 uuid not null references public.profiles(id) on delete cascade,
    plan_id                 uuid not null references public.plans(id),
    stripe_subscription_id  text,
    stripe_customer_id      text,
    status                  text not null check (status in ('active','canceled','past_due','trialing','expired')),
    billing_interval        text not null check (billing_interval in ('monthly','quarterly')),
    current_period_start    timestamptz,
    current_period_end      timestamptz,
    cancel_at_period_end    boolean not null default false,
    created_at              timestamptz not null default now(),
    updated_at              timestamptz not null default now()
);

create table if not exists public.invoices (
    id                  uuid primary key default gen_random_uuid(),
    subscription_id     uuid references public.subscriptions(id) on delete set null,
    user_id             uuid not null references public.profiles(id) on delete cascade,
    stripe_invoice_id   text,
    amount              integer not null,
    currency            text not null default 'usd',
    status              text not null check (status in ('paid','pending','failed')),
    invoice_date        timestamptz not null,
    paid_at             timestamptz
);

create index if not exists idx_subscriptions_user_id on public.subscriptions(user_id);
create index if not exists idx_subscriptions_status on public.subscriptions(status);
create index if not exists idx_invoices_user_id on public.invoices(user_id);
create index if not exists idx_invoices_invoice_date on public.invoices(invoice_date desc);
create index if not exists idx_profiles_email on public.profiles(email);

-- =====================================================================
-- updated_at triggers
-- =====================================================================

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists trg_subscriptions_updated_at on public.subscriptions;
create trigger trg_subscriptions_updated_at
before update on public.subscriptions
for each row execute function public.set_updated_at();

-- =====================================================================
-- Profile-creation trigger
-- Auto-creates a profile row when a new auth user signs up.
-- Promotes the owner's email to admin automatically.
-- =====================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.profiles (id, email, full_name, avatar_url, is_admin)
    values (
        new.id,
        new.email,
        coalesce(new.raw_user_meta_data->>'full_name', ''),
        new.raw_user_meta_data->>'avatar_url',
        new.email = 'kareem.hosny2001@gmail.com'
    )
    on conflict (id) do nothing;
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- =====================================================================
-- Row Level Security
-- Service role (used by FastAPI) bypasses RLS automatically.
-- =====================================================================

alter table public.profiles       enable row level security;
alter table public.plans          enable row level security;
alter table public.subscriptions  enable row level security;
alter table public.invoices       enable row level security;

-- profiles: users read/update their own row
drop policy if exists "profiles_self_select" on public.profiles;
create policy "profiles_self_select" on public.profiles
    for select using (auth.uid() = id);

drop policy if exists "profiles_self_update" on public.profiles;
create policy "profiles_self_update" on public.profiles
    for update using (auth.uid() = id);

-- plans: anyone authenticated can read active plans
drop policy if exists "plans_public_select" on public.plans;
create policy "plans_public_select" on public.plans
    for select using (is_active = true);

-- subscriptions: users read their own
drop policy if exists "subscriptions_self_select" on public.subscriptions;
create policy "subscriptions_self_select" on public.subscriptions
    for select using (auth.uid() = user_id);

-- invoices: users read their own
drop policy if exists "invoices_self_select" on public.invoices;
create policy "invoices_self_select" on public.invoices
    for select using (auth.uid() = user_id);

-- =====================================================================
-- Plan seed data
-- Prices in cents. Idempotent via ON CONFLICT on name.
-- =====================================================================

insert into public.plans (name, description, features, monthly_price, quarterly_price, sort_order)
values
    (
        'Starter',
        'Everything you need to get off the ground.',
        '["Up to 5 projects","Basic analytics","Email support","1 team member"]'::jsonb,
        900, 2400, 1
    ),
    (
        'Professional',
        'For growing teams that need more power and flexibility.',
        '["Unlimited projects","Advanced analytics","Priority support","Up to 10 team members","API access","Custom integrations"]'::jsonb,
        2900, 7800, 2
    ),
    (
        'Enterprise',
        'Advanced capabilities, security, and dedicated support.',
        '["Everything in Professional","Unlimited team members","Dedicated account manager","SSO & SAML","99.9% SLA","Custom contracts"]'::jsonb,
        9900, 26700, 3
    )
on conflict do nothing;

-- Ensure the name column is unique so re-runs are idempotent going forward.
create unique index if not exists plans_name_unique on public.plans(name);
