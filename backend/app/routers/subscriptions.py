from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException

from app.dependencies import CurrentUser, get_current_user
from app.models.schemas import CheckoutRequest
from app.services.supabase_service import get_active_subscription, get_profile, supabase_admin

router = APIRouter()


@router.get("/current")
def current_subscription(user: CurrentUser = Depends(get_current_user)):
    sub = get_active_subscription(user.id)
    return sub


@router.get("/history")
def subscription_history(user: CurrentUser = Depends(get_current_user)):
    res = (
        supabase_admin.table("subscriptions")
        .select("*, plan:plans(*)")
        .eq("user_id", user.id)
        .order("created_at", desc=True)
        .execute()
    )
    return res.data or []


@router.post("/subscribe")
def subscribe(
    body: CheckoutRequest,
    user: CurrentUser = Depends(get_current_user),
):
    """Demo-mode subscribe: upserts a subscription row, no Stripe involved.

    Creates one invoice row to represent the first period payment so the
    Invoices page and admin revenue chart have something to show.
    """
    plan_res = (
        supabase_admin.table("plans").select("*").eq("id", body.plan_id).maybe_single().execute()
    )
    if not plan_res.data:
        raise HTTPException(404, "Plan not found")
    plan = plan_res.data

    profile = get_profile(user.id)
    if not profile:
        raise HTTPException(404, "Profile not found")

    period_days = 30 if body.billing_interval == "monthly" else 90
    now = datetime.now(timezone.utc)
    period_end = now + timedelta(days=period_days)
    amount = plan["monthly_price"] if body.billing_interval == "monthly" else plan["quarterly_price"]

    existing = (
        supabase_admin.table("subscriptions")
        .select("id")
        .eq("user_id", user.id)
        .in_("status", ["active", "trialing", "past_due"])
        .limit(1)
        .execute()
    )

    if existing.data:
        sub_id = existing.data[0]["id"]
        sub_res = (
            supabase_admin.table("subscriptions")
            .update(
                {
                    "plan_id": plan["id"],
                    "billing_interval": body.billing_interval,
                    "status": "active",
                    "current_period_start": now.isoformat(),
                    "current_period_end": period_end.isoformat(),
                    "cancel_at_period_end": False,
                }
            )
            .eq("id", sub_id)
            .execute()
        )
        subscription = sub_res.data[0] if sub_res.data else None
    else:
        sub_res = (
            supabase_admin.table("subscriptions")
            .insert(
                {
                    "user_id": user.id,
                    "plan_id": plan["id"],
                    "billing_interval": body.billing_interval,
                    "status": "active",
                    "current_period_start": now.isoformat(),
                    "current_period_end": period_end.isoformat(),
                    "cancel_at_period_end": False,
                }
            )
            .execute()
        )
        subscription = sub_res.data[0] if sub_res.data else None

    if subscription:
        supabase_admin.table("invoices").insert(
            {
                "subscription_id": subscription["id"],
                "user_id": user.id,
                "amount": amount,
                "currency": "usd",
                "status": "paid",
                "invoice_date": now.isoformat(),
                "paid_at": now.isoformat(),
            }
        ).execute()

    return subscription


@router.post("/cancel")
def cancel(user: CurrentUser = Depends(get_current_user)):
    """Demo-mode cancel: sets the active subscription to canceled immediately."""
    res = (
        supabase_admin.table("subscriptions")
        .update({"status": "canceled", "cancel_at_period_end": False})
        .eq("user_id", user.id)
        .in_("status", ["active", "trialing", "past_due"])
        .execute()
    )
    if not res.data:
        raise HTTPException(404, "No active subscription to cancel")
    return res.data[0]
