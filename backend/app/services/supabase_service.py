import httpx
from supabase import Client, create_client

from app.config import settings

supabase_admin: Client = create_client(
    settings.SUPABASE_URL,
    settings.SUPABASE_SERVICE_ROLE_KEY,
)

# Render's free tier kills idle outbound connections, which causes the postgrest
# HTTP/2 client to raise httpx.ReadError on the next request. Replace its session
# with an HTTP/1.1 client that never reuses connections.
_postgrest_session = supabase_admin.postgrest.session
_new_session = httpx.Client(
    base_url=str(_postgrest_session.base_url),
    headers=dict(_postgrest_session.headers),
    timeout=httpx.Timeout(30.0, connect=10.0),
    http2=False,
    limits=httpx.Limits(max_keepalive_connections=0, max_connections=20),
)
_postgrest_session.close()
supabase_admin.postgrest.session = _new_session


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
