"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Bell, Menu } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { SidebarNav } from "@/components/dashboard/sidebar";
import { initials } from "@/lib/utils";
import type { Profile } from "@/lib/types";

const TITLES: Record<string, string> = {
  "/dashboard": "Overview",
  "/dashboard/subscription": "Subscription",
  "/dashboard/plans": "Plans",
  "/dashboard/invoices": "Invoices",
  "/dashboard/settings": "Settings",
  "/dashboard/admin": "Admin dashboard",
  "/dashboard/admin/users": "Users",
  "/dashboard/admin/subscriptions": "Subscriptions",
  "/dashboard/checkout/success": "Success",
};

function resolveTitle(pathname: string): string {
  if (TITLES[pathname]) return TITLES[pathname];
  const match = Object.keys(TITLES)
    .filter((k) => pathname.startsWith(k))
    .sort((a, b) => b.length - a.length)[0];
  return match ? TITLES[match] : "Dashboard";
}

export function Topbar({ profile }: { profile: Profile }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-100 bg-white/80 px-4 backdrop-blur sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SidebarNav profile={profile} onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>
        <h1 className="font-display text-lg font-semibold tracking-tight">{resolveTitle(pathname)}</h1>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="h-5 w-5 text-ink-muted" />
        </Button>
        <Avatar className="h-9 w-9">
          {profile.avatar_url && <AvatarImage src={profile.avatar_url} alt={profile.full_name} />}
          <AvatarFallback>{initials(profile.full_name, profile.email)}</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
