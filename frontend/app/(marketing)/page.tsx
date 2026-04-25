import Link from "next/link";
import { ArrowRight, BarChart3, CreditCard, Sparkles, ShieldCheck, Zap, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const features = [
  {
    icon: CreditCard,
    title: "Stripe-native billing",
    body: "Checkout, customer portal, and webhooks wired end-to-end. Your customers get a familiar flow; you get trustworthy state.",
  },
  {
    icon: BarChart3,
    title: "Analytics that matter",
    body: "MRR, churn, plan distribution, and billing mix in one editorial dashboard. No noisy charts, no cargo-cult KPIs.",
  },
  {
    icon: Sparkles,
    title: "AI support assistant",
    body: "Context-aware Claude-powered helper answers plan, billing, and subscription questions — all without leaving the app.",
  },
  {
    icon: ShieldCheck,
    title: "RLS by default",
    body: "Every read is scoped at the database with Supabase Row Level Security. Service role is confined to the backend.",
  },
  {
    icon: Zap,
    title: "Instant upgrades",
    body: "Switch plans, toggle monthly and quarterly, or cancel at period end — state stays consistent with Stripe in real time.",
  },
  {
    icon: Users,
    title: "Admin workspace",
    body: "A polished admin view built for operators: searchable users, subscription detail, and signals you'll actually use.",
  },
];

export default function LandingPage() {
  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-brand/10 blur-3xl" aria-hidden />
        <div className="absolute -right-32 top-32 h-96 w-96 rounded-full bg-accent/10 blur-3xl" aria-hidden />

        <div className="mx-auto max-w-7xl px-6 pb-20 pt-24 sm:pt-32">
          <div className="mx-auto max-w-3xl text-center animate-fade-in">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/5 px-3 py-1 text-xs font-medium text-brand">
              <Sparkles className="h-3 w-3" /> Built for premium SaaS teams
            </span>
            <h1 className="mt-6 font-display text-5xl font-semibold tracking-tight sm:text-6xl">
              Subscription management,{" "}
              <span className="bg-gradient-to-r from-brand to-accent bg-clip-text text-transparent">
                simplified.
              </span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-ink-muted">
              SubFlow gives teams a clean workspace for plans, checkout, invoices, and AI-powered support —
              without the chrome of a generic SaaS admin panel.
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg">
                <Link href="/register">
                  Get started <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/pricing">View pricing</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, body }) => (
            <Card
              key={title}
              className="group p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/10 text-brand">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 font-display text-lg font-semibold tracking-tight">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{body}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-100 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-16 text-center">
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Ready to ship your subscription experience?
          </h2>
          <p className="mt-3 text-base text-ink-muted">
            Start for free in test mode. Flip a key to go live.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/register">Create your account</Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href="/pricing">Compare plans</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
