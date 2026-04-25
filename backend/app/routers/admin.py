from __future__ import annotations

from collections import defaultdict
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from app.dependencies import CurrentUser, get_admin_user
from app.services.supabase_service import supabase_admin

router = APIRouter(dependencies=[Depends(get_admin_user)])


def _month_key(dt: datetime) -> str:
    return dt.strftime("%Y-%m")


def _last_n_months(n: int) -> list[str]:
    now = datetime.now(timezone.utc).replace(day=1)
    keys: list[str] = []
    for i in range(n - 1, -1, -1):
        month = now.month - i
        year = now.year
        while month <= 0:
            month += 12
            year -= 1
        keys.append(f"{year:04d}-{month:02d}")
    return keys


def _parse(ts: str | None) -> datetime | None:
    if not ts:
        return None
    try:
        return datetime.fromisoformat(ts.replace("Z", "+00:00"))
    except ValueError:
        return None


@router.get("/stats")
def stats(_: CurrentUser = Depends(get_admin_user)):
    profiles = supabase_admin.table("profiles").select("id", count="exact").execute()
    active = (
        supabase_admin.table("subscriptions")
        .select("id,billing_interval,plan:plans(monthly_price,quarterly_price)", count="exact")
        .eq("status", "active")
        .execute()
    )
    month_ago = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
    canceled_30 = (
        supabase_admin.table("subscriptions")
        .select("id", count="exact")
        .eq("status", "canceled")
        .gte("updated_at", month_ago)
        .execute()
    )

    mrr_cents = 0
    for row in active.data or []:
        plan = row.get("plan") or {}
        if row["billing_interval"] == "monthly":
            mrr_cents += plan.get("monthly_price") or 0
        else:
            mrr_cents += (plan.get("quarterly_price") or 0) // 3

    total_active = active.count or 0
    canceled_count = canceled_30.count or 0
    churn_rate = (canceled_count / total_active * 100.0) if total_active else 0.0

    return {
        "total_users": profiles.count or 0,
        "active_subscriptions": total_active,
        "mrr": mrr_cents,
        "churn_rate": round(churn_rate, 2),
    }


@router.get("/charts/subscriber-growth")
def subscriber_growth():
    months = _last_n_months(8)
    res = (
        supabase_admin.table("subscriptions")
        .select("created_at")
        .gte("created_at", months[0] + "-01")
        .execute()
    )
    buckets: dict[str, int] = {m: 0 for m in months}
    for row in res.data or []:
        dt = _parse(row["created_at"])
        if not dt:
            continue
        key = _month_key(dt)
        if key in buckets:
            buckets[key] += 1
    return [{"month": m, "count": buckets[m]} for m in months]


@router.get("/charts/revenue")
def revenue():
    months = _last_n_months(8)
    res = (
        supabase_admin.table("invoices")
        .select("invoice_date,amount,status")
        .eq("status", "paid")
        .gte("invoice_date", months[0] + "-01")
        .execute()
    )
    buckets: dict[str, int] = {m: 0 for m in months}
    for row in res.data or []:
        dt = _parse(row["invoice_date"])
        if not dt:
            continue
        key = _month_key(dt)
        if key in buckets:
            buckets[key] += row.get("amount") or 0
    return [{"month": m, "revenue": buckets[m]} for m in months]


@router.get("/charts/plan-distribution")
def plan_distribution():
    res = (
        supabase_admin.table("subscriptions")
        .select("plan:plans(id,name)")
        .eq("status", "active")
        .execute()
    )
    counts: dict[str, int] = defaultdict(int)
    for row in res.data or []:
        plan = row.get("plan") or {}
        name = plan.get("name") or "Unknown"
        counts[name] += 1
    return [{"plan": name, "count": c} for name, c in counts.items()]


@router.get("/charts/billing-split")
def billing_split():
    res = (
        supabase_admin.table("subscriptions")
        .select("billing_interval")
        .eq("status", "active")
        .execute()
    )
    counts = {"monthly": 0, "quarterly": 0}
    for row in res.data or []:
        interval = row.get("billing_interval")
        if interval in counts:
            counts[interval] += 1
    return [{"interval": k, "count": v} for k, v in counts.items()]


@router.get("/users")
def list_users(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: str | None = None,
    plan_filter: str | None = None,
    status_filter: str | None = None,
):
    start = (page - 1) * per_page
    end = start + per_page - 1

    query = supabase_admin.table("profiles").select(
        "id,full_name,email,avatar_url,is_admin,created_at,subscriptions(status,billing_interval,plan:plans(name))",
        count="exact",
    )
    if search:
        escaped = search.replace("%", r"\%").replace(",", r"\,")
        query = query.or_(f"full_name.ilike.%{escaped}%,email.ilike.%{escaped}%")

    res = query.order("created_at", desc=True).range(start, end).execute()

    items = []
    for row in res.data or []:
        subs = row.get("subscriptions") or []
        active = next(
            (s for s in subs if s.get("status") in ("active", "trialing", "past_due")),
            subs[0] if subs else None,
        )
        plan_name = ((active or {}).get("plan") or {}).get("name")
        sub_status = (active or {}).get("status")
        interval = (active or {}).get("billing_interval")
        if plan_filter and plan_name != plan_filter:
            continue
        if status_filter and sub_status != status_filter:
            continue
        items.append(
            {
                "id": row["id"],
                "full_name": row["full_name"],
                "email": row["email"],
                "avatar_url": row.get("avatar_url"),
                "is_admin": row.get("is_admin", False),
                "created_at": row["created_at"],
                "plan_name": plan_name,
                "status": sub_status,
                "billing_interval": interval,
            }
        )

    return {"items": items, "total": res.count or 0, "page": page, "per_page": per_page}


@router.get("/subscriptions")
def list_subscriptions(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    plan_filter: str | None = None,
    status_filter: str | None = None,
    interval_filter: str | None = None,
):
    start = (page - 1) * per_page
    end = start + per_page - 1

    query = supabase_admin.table("subscriptions").select(
        "*, user:profiles(full_name,email,avatar_url), plan:plans(name,monthly_price,quarterly_price)",
        count="exact",
    )
    if status_filter:
        query = query.eq("status", status_filter)
    if interval_filter:
        query = query.eq("billing_interval", interval_filter)

    res = query.order("created_at", desc=True).range(start, end).execute()

    items = res.data or []
    if plan_filter:
        items = [i for i in items if (i.get("plan") or {}).get("name") == plan_filter]

    summary_res = (
        supabase_admin.table("subscriptions")
        .select("status", count="exact")
        .execute()
    )
    all_subs = summary_res.data or []
    summary = {
        "active": sum(1 for s in all_subs if s["status"] == "active"),
        "canceled": sum(1 for s in all_subs if s["status"] == "canceled"),
        "past_due": sum(1 for s in all_subs if s["status"] == "past_due"),
    }

    return {
        "items": items,
        "total": res.count or 0,
        "page": page,
        "per_page": per_page,
        "summary": summary,
    }


@router.get("/recent-activity")
def recent_activity():
    signups = (
        supabase_admin.table("profiles")
        .select("id,full_name,email,avatar_url,created_at")
        .order("created_at", desc=True)
        .limit(10)
        .execute()
    )
    subs = (
        supabase_admin.table("subscriptions")
        .select("id,created_at,status,billing_interval,user:profiles(full_name,email,avatar_url),plan:plans(name)")
        .order("created_at", desc=True)
        .limit(10)
        .execute()
    )

    activity = []
    for p in signups.data or []:
        activity.append(
            {
                "kind": "signup",
                "at": p["created_at"],
                "full_name": p.get("full_name"),
                "email": p.get("email"),
                "avatar_url": p.get("avatar_url"),
                "detail": "joined SubFlow",
            }
        )
    for s in subs.data or []:
        user = s.get("user") or {}
        plan = (s.get("plan") or {}).get("name") or "a plan"
        activity.append(
            {
                "kind": "subscription",
                "at": s["created_at"],
                "full_name": user.get("full_name"),
                "email": user.get("email"),
                "avatar_url": user.get("avatar_url"),
                "detail": f"subscribed to {plan} ({s.get('billing_interval')})",
            }
        )

    activity.sort(key=lambda a: a["at"], reverse=True)
    return activity[:20]


class AdminRoleBody(BaseModel):
    is_admin: bool


@router.post("/users/{user_id}/admin-role")
def set_admin_role(
    user_id: str,
    body: AdminRoleBody,
    actor: CurrentUser = Depends(get_admin_user),
):
    if user_id == actor.id:
        raise HTTPException(400, "You can't change your own admin role")

    res = (
        supabase_admin.table("profiles")
        .update({"is_admin": body.is_admin})
        .eq("id", user_id)
        .execute()
    )
    if not res.data:
        raise HTTPException(404, "User not found")
    return res.data[0]
