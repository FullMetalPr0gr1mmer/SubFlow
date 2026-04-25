from supabase import Client, create_client

from app.config import settings

supabase_admin: Client = create_client(
    settings.SUPABASE_URL,
    settings.SUPABASE_SERVICE_ROLE_KEY,
)


def get_profile(user_id: str) -> dict | None:
    res = supabase_admin.table("profiles").select("*").eq("id", user_id).maybe_single().execute()
    return res.data


def get_active_subscription(user_id: str) -> dict | None:
    res = (
        supabase_admin.table("subscriptions")
        .select("*, plan:plans(*)")
        .eq("user_id", user_id)
        .in_("status", ["active", "trialing", "past_due"])
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    return res.data[0] if res.data else None


def upsert_subscription(data: dict) -> dict:
    res = (
        supabase_admin.table("subscriptions")
        .upsert(data, on_conflict="stripe_subscription_id")
        .execute()
    )
    return res.data[0] if res.data else {}
