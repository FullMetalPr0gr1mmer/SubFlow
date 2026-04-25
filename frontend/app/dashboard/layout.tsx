import { redirect } from "next/navigation";
import { SidebarNav } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { UserProvider } from "@/components/dashboard/user-context";
import { ChatWidget } from "@/components/chat/chat-widget";
import { createClient } from "@/lib/supabase/server";
import type { MeResponse, Profile, Subscription } from "@/lib/types";

async function loadUser(): Promise<MeResponse | null> {
  const supabase = createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) return null;

  const [profileRes, subRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase
      .from("subscriptions")
      .select("*, plan:plans(*)")
      .eq("user_id", user.id)
      .in("status", ["active", "trialing", "past_due"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (!profileRes.data) return null;

  return {
    profile: profileRes.data as Profile,
    subscription: (subRes.data as Subscription | null) ?? null,
  };
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const me = await loadUser();
  if (!me) redirect("/login");

  return (
    <UserProvider value={me}>
      <div className="flex min-h-screen">
        <aside className="hidden w-[260px] shrink-0 lg:block">
          <div className="fixed inset-y-0 left-0 w-[260px]">
            <SidebarNav profile={me.profile} />
          </div>
        </aside>
        <div className="flex flex-1 flex-col">
          <Topbar profile={me.profile} />
          <main className="flex-1 animate-fade-in p-6 sm:p-8">{children}</main>
        </div>
      </div>
      <ChatWidget />
    </UserProvider>
  );
}
