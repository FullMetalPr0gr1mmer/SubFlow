import Link from "next/link";
import { cn } from "@/lib/utils";

interface AuthShellProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  className?: string;
}

export function AuthShell({ children, title, subtitle, className }: AuthShellProps) {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <aside className="relative hidden overflow-hidden bg-sidebar-bg text-white lg:flex lg:w-[60%] lg:flex-col lg:justify-between lg:p-14 gradient-sidebar">
        <div className="absolute inset-0 grid-pattern opacity-40" aria-hidden />
        <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-brand/30 blur-3xl" aria-hidden />
        <div className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-accent/20 blur-3xl" aria-hidden />

        <Link href="/" className="relative z-10 inline-flex items-center gap-3 text-xl font-semibold tracking-tight">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-accent shadow-lg">
            <span className="font-display text-sm font-bold">S</span>
          </span>
          SubFlow
        </Link>

        <div className="relative z-10 max-w-lg">
          <h2 className="font-display text-4xl font-semibold leading-tight text-white">
            Manage your subscriptions intelligently.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-300">
            One unified workspace for plans, billing, invoices, and AI-powered support — built for teams
            that care about the details.
          </p>
          <div className="mt-10 space-y-4">
            {[
              "Real-time revenue and churn dashboards",
              "Stripe-native checkout and customer portal",
              "AI support assistant with context awareness",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 text-sm text-slate-200">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-brand">
                  <span className="h-2 w-2 rounded-full bg-brand" />
                </span>
                {item}
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-xs text-slate-400">
          © {new Date().getFullYear()} SubFlow · Crafted for premium SaaS teams.
        </p>
      </aside>

      <main className={cn("flex flex-1 items-center justify-center bg-canvas p-6 sm:p-10", className)}>
        <div className="w-full max-w-md animate-fade-in">
          <Link href="/" className="mb-10 inline-flex items-center gap-2 text-lg font-semibold tracking-tight lg:hidden">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand to-accent text-white">
              S
            </span>
            SubFlow
          </Link>
          <h1 className="font-display text-3xl font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-ink-muted">{subtitle}</p>}
          <div className="mt-8">{children}</div>
        </div>
      </main>
    </div>
  );
}
