from __future__ import annotations

from datetime import datetime, timezone

import stripe
from fastapi import APIRouter, Depends, HTTPException, Header, Request

from app.config import settings
from app.dependencies import CurrentUser, get_current_user
from app.models.schemas import CheckoutRequest, CheckoutResponse, PortalResponse
from app.services.stripe_service import (
    create_checkout_session,
    create_portal_session,
    ensure_customer,
    ensure_price_id,
)
from app.services.supabase_service import get_profile, supabase_admin

router = APIRouter()


def _to_dt(ts: int | None) -> str | None:
    if ts is None:
        return None
    return datetime.fromtimestamp(ts, tz=timezone.utc).isoformat()


@router.post("/create-checkout", response_model=CheckoutResponse)
def create_checkout(
    body: CheckoutRequest,
    user: CurrentUser = Depends(get_current_user),
):
    plan_res = (
        supabase_admin.table("plans").select("*").eq("id", body.plan_id).maybe_single().execute()
    )
    if not plan_res.data:
        raise HTTPException(404, "Plan not found")
    plan = plan_res.data

    profile = get_profile(user.id)
    if not profile:
        raise HTTPException(404, "Profile not found")

    customer_id = ensure_customer(user.id, profile["email"], profile.get("full_name"))
    price_id = ensure_price_id(plan, body.billing_interval)
    url = create_checkout_session(customer_id, price_id, plan["id"], body.billing_interval)
    return CheckoutResponse(url=url)


@router.post("/create-portal", response_model=PortalResponse)
def create_portal(user: CurrentUser = Depends(get_current_user)):
    sub_res = (
        supabase_admin.table("subscriptions")
        .select("stripe_customer_id")
        .eq("user_id", user.id)
        .not_.is_("stripe_customer_id", "null")
        .limit(1)
        .execute()
    )
    if not sub_res.data:
        raise HTTPException(400, "No Stripe customer on file. Subscribe to a plan first.")
    url = create_portal_session(sub_res.data[0]["stripe_customer_id"])
    return PortalResponse(url=url)


@router.post("/reconcile-session")
def reconcile_session(
    session_id: str,
    user: CurrentUser = Depends(get_current_user),
):
    """Pull subscription + latest invoice state from Stripe and write to DB.

    Intended to run on the checkout-success page as a fallback for local dev
    where webhooks aren't being forwarded. Safe to call multiple times —
    uses upsert on stripe_subscription_id / stripe_invoice_id.
    """
    try:
        session = stripe.checkout.Session.retrieve(
            session_id, expand=["subscription", "customer", "invoice"]
        )
    except stripe.error.StripeError as e:
        raise HTTPException(400, f"Could not retrieve session: {e}")

    customer = session.get("customer")
    customer_id = customer["id"] if isinstance(customer, dict) else customer
    subscription = session.get("subscription")
    if not (customer_id and subscription):
        raise HTTPException(400, "Session has no subscription yet. Try again in a moment.")

    owner_id = (customer.get("metadata") or {}).get("supabase_user_id") if isinstance(customer, dict) else None
    if owner_id and owner_id != user.id:
        raise HTTPException(403, "This checkout belongs to a different user")

    metadata = session.get("metadata") or {}
    plan_id = metadata.get("plan_id")
    interval = metadata.get("billing_interval")
    if not (plan_id and interval):
        sub_meta = (subscription.get("metadata") or {}) if isinstance(subscription, dict) else {}
        plan_id = plan_id or sub_meta.get("plan_id")
        interval = interval or sub_meta.get("billing_interval")
    if not (plan_id and interval):
        raise HTTPException(400, "Session missing plan metadata")

    sub_obj = subscription if isinstance(subscription, dict) else stripe.Subscription.retrieve(subscription)
    _upsert_subscription_from_stripe(sub_obj, user_id=user.id, plan_id=plan_id, interval=interval)

    invoice = session.get("invoice")
    if invoice:
        inv_obj = invoice if isinstance(invoice, dict) else stripe.Invoice.retrieve(invoice)
        status = "paid" if inv_obj.get("status") == "paid" else (
            "failed" if inv_obj.get("status") in ("uncollectible", "void") else "pending"
        )
        _handle_invoice(inv_obj, status)

    return {"reconciled": True, "subscription_id": sub_obj["id"]}


@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    stripe_signature: str | None = Header(default=None, alias="stripe-signature"),
):
    if not stripe_signature:
        raise HTTPException(400, "Missing Stripe signature")
    raw_body = await request.body()

    try:
        event = stripe.Webhook.construct_event(
            payload=raw_body,
            sig_header=stripe_signature,
            secret=settings.STRIPE_WEBHOOK_SECRET,
        )
    except (ValueError, stripe.SignatureVerificationError) as e:
        raise HTTPException(400, f"Invalid webhook: {e}")

    event_type = event["type"]
    obj = event["data"]["object"]

    if event_type == "checkout.session.completed":
        await _handle_checkout_completed(obj)
    elif event_type in ("customer.subscription.updated", "customer.subscription.created"):
        _handle_subscription_updated(obj)
    elif event_type == "customer.subscription.deleted":
        _handle_subscription_deleted(obj)
    elif event_type == "invoice.payment_succeeded":
        _handle_invoice(obj, "paid")
    elif event_type == "invoice.payment_failed":
        _handle_invoice(obj, "failed")

    return {"received": True}


async def _handle_checkout_completed(session: dict) -> None:
    customer_id = session.get("customer")
    subscription_id = session.get("subscription")
    metadata = session.get("metadata") or {}
    plan_id = metadata.get("plan_id")
    interval = metadata.get("billing_interval")

    if not (customer_id and subscription_id and plan_id and interval):
        return

    customer = stripe.Customer.retrieve(customer_id)
    user_id = (customer.get("metadata") or {}).get("supabase_user_id")
    if not user_id:
        return

    sub = stripe.Subscription.retrieve(subscription_id)
    _upsert_subscription_from_stripe(sub, user_id=user_id, plan_id=plan_id, interval=interval)


def _handle_subscription_updated(sub: dict) -> None:
    customer_id = sub.get("customer")
    if not customer_id:
        return
    customer = stripe.Customer.retrieve(customer_id)
    user_id = (customer.get("metadata") or {}).get("supabase_user_id")
    if not user_id:
        return
    metadata = sub.get("metadata") or {}
    plan_id = metadata.get("plan_id")
    interval = metadata.get("billing_interval")
    if not (plan_id and interval):
        existing = (
            supabase_admin.table("subscriptions")
            .select("plan_id,billing_interval")
            .eq("stripe_subscription_id", sub["id"])
            .maybe_single()
            .execute()
        )
        if existing.data:
            plan_id = plan_id or existing.data["plan_id"]
            interval = interval or existing.data["billing_interval"]
        if not (plan_id and interval):
            return
    _upsert_subscription_from_stripe(sub, user_id=user_id, plan_id=plan_id, interval=interval)


def _handle_subscription_deleted(sub: dict) -> None:
    supabase_admin.table("subscriptions").update(
        {"status": "canceled", "cancel_at_period_end": False}
    ).eq("stripe_subscription_id", sub["id"]).execute()


def _handle_invoice(inv: dict, status: str) -> None:
    customer_id = inv.get("customer")
    if not customer_id:
        return
    customer = stripe.Customer.retrieve(customer_id)
    user_id = (customer.get("metadata") or {}).get("supabase_user_id")
    if not user_id:
        return

    sub_id_stripe = inv.get("subscription")
    subscription_row_id = None
    if sub_id_stripe:
        sub_row = (
            supabase_admin.table("subscriptions")
            .select("id")
            .eq("stripe_subscription_id", sub_id_stripe)
            .maybe_single()
            .execute()
        )
        if sub_row.data:
            subscription_row_id = sub_row.data["id"]

    invoice_date = _to_dt(inv.get("created")) or datetime.now(timezone.utc).isoformat()
    paid_at = _to_dt(inv.get("status_transitions", {}).get("paid_at")) if status == "paid" else None

    supabase_admin.table("invoices").upsert(
        {
            "stripe_invoice_id": inv["id"],
            "subscription_id": subscription_row_id,
            "user_id": user_id,
            "amount": inv.get("amount_paid") or inv.get("amount_due") or 0,
            "currency": inv.get("currency", "usd"),
            "status": status,
            "invoice_date": invoice_date,
            "paid_at": paid_at,
        },
        on_conflict="stripe_invoice_id",
    ).execute()


def _upsert_subscription_from_stripe(sub: dict, *, user_id: str, plan_id: str, interval: str) -> None:
    status_map = {
        "active": "active",
        "trialing": "trialing",
        "past_due": "past_due",
        "canceled": "canceled",
        "incomplete": "past_due",
        "incomplete_expired": "expired",
        "unpaid": "past_due",
    }
    status = status_map.get(sub.get("status", ""), "active")

    supabase_admin.table("subscriptions").upsert(
        {
            "user_id": user_id,
            "plan_id": plan_id,
            "stripe_subscription_id": sub["id"],
            "stripe_customer_id": sub.get("customer"),
            "status": status,
            "billing_interval": interval,
            "current_period_start": _to_dt(sub.get("current_period_start")),
            "current_period_end": _to_dt(sub.get("current_period_end")),
            "cancel_at_period_end": bool(sub.get("cancel_at_period_end")),
        },
        on_conflict="stripe_subscription_id",
    ).execute()
