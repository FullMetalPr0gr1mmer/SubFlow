import Link from "next/link";
import { Button } from "@/components/ui/button";

export function MarketingNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-100/80 bg-white/80 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand to-accent text-white">
            S
          </span>
          SubFlow
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/pricing"
            className="hidden rounded-lg px-3 py-2 text-sm font-medium text-ink-muted hover:bg-slate-100 hover:text-ink sm:inline-block"
          >
            Pricing
          </Link>
          <Link
            href="/login"
            className="rounded-lg px-3 py-2 text-sm font-medium text-ink-muted hover:bg-slate-100 hover:text-ink"
          >
            Sign in
          </Link>
          <Button asChild size="sm">
            <Link href="/register">Get started</Link>
          </Button>
        </div>
      </nav>
    </header>
  );
}

export function MarketingFooter() {
  return (
    <footer className="border-t border-slate-100 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-10 text-sm text-ink-muted sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 font-medium text-ink">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-brand to-accent text-white text-xs">
            S
          </span>
          SubFlow
        </div>
        <p>© {new Date().getFullYear()} SubFlow. All rights reserved.</p>
        <div className="flex gap-5">
          <Link href="/pricing" className="hover:text-ink">Pricing</Link>
          <Link href="/login" className="hover:text-ink">Sign in</Link>
          <Link href="/register" className="hover:text-ink">Get started</Link>
        </div>
      </div>
    </footer>
  );
}
