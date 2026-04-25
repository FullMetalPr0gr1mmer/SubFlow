"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  CreditCard,
  FileText,
  Layers,
  LayoutDashboard,
  List,
  LogOut,
  Settings,
  Users,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { cn, initials } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
}

const USER_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/subscription", label: "Subscription", icon: CreditCard },
  { href: "/dashboard/plans", label: "Plans", icon: Layers },
  { href: "/dashboard/invoices", label: "Invoices", icon: FileText },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

const ADMIN_NAV: NavItem[] = [
  { href: "/dashboard/admin", label: "Admin dashboard", icon: BarChart3 },
  { href: "/dashboard/admin/users", label: "Users", icon: Users },
  { href: "/dashboard/admin/subscriptions", label: "Subscriptions", icon: List },
];

export function SidebarNav({ profile, onNavigate }: { profile: Profile; onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const PARENT_ROUTES = new Set(["/dashboard", "/dashboard/admin"]);

  const linkClasses = (href: string) => {
    const active = PARENT_ROUTES.has(href)
      ? pathname === href
      : pathname === href || pathname.startsWith(href + "/");
    return cn(
      "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
      active
        ? "bg-brand/15 text-white border-l-2 border-brand -ml-[2px] pl-[calc(0.75rem-2px)]"
        : "text-sidebar-text hover:bg-white/5 hover:text-white",
    );
  };

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  const renderItem = (item: NavItem) => {
    const Icon = item.icon;
    return (
      <Link key={item.href} href={item.href} className={linkClasses(item.href)} onClick={onNavigate}>
        <Icon className="h-4 w-4" />
        <span>{item.label}</span>
      </Link>
    );
  };

  return (
    <div className="flex h-full flex-col bg-sidebar-bg">
      <div className="flex items-center gap-2 px-6 py-6 text-white">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-accent shadow-lg">
          <span className="font-display text-sm font-bold">S</span>
        </span>
        <span className="font-display text-lg font-semibold tracking-tight">SubFlow</span>
      </div>

      <nav className="flex-1 space-y-1 px-4">
        {USER_NAV.map(renderItem)}

        {profile.is_admin && (
          <>
            <Separator className="my-4 bg-white/10" />
            <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-sidebar-text/70">
              Admin
            </p>
            {ADMIN_NAV.map(renderItem)}
          </>
        )}
      </nav>

      <div className="border-t border-white/5 p-4">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left text-sm text-white transition-colors hover:bg-white/5">
            <Avatar className="h-9 w-9">
              {profile.avatar_url && <AvatarImage src={profile.avatar_url} alt={profile.full_name} />}
              <AvatarFallback className="bg-white/10 text-white">
                {initials(profile.full_name, profile.email)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 truncate">
              <p className="truncate text-sm font-medium text-white">
                {profile.full_name || profile.email}
              </p>
              <p className="truncate text-xs text-sidebar-text">{profile.email}</p>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My account</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings">
                <Settings className="h-4 w-4" /> Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-danger focus:bg-red-50 focus:text-danger">
              <LogOut className="h-4 w-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
