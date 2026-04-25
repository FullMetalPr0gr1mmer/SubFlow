from __future__ import annotations

import stripe

from app.config import settings
from app.services.supabase_service import supabase_admin

stripe.api_key = settings.STRIPE_SECRET_KEY


def ensure_customer(user_id: str, email: str, full_name: str | None) -> str:
    existing = (
        supabase_admin.table("subscriptions")
        .select("stripe_customer_id")
        .eq("user_id", user_id)
        .not_.is_("stripe_customer_id", "null")
        .limit(1)
        .execute()
    )
    if existing.data and existing.data[0].get("stripe_customer_id"):
        return existing.data[0]["stripe_customer_id"]

    customer = stripe.Customer.create(
        email=email,
        name=full_name or None,
        metadata={"supabase_user_id": user_id},
    )
    return customer.id


def ensure_price_id(plan: dict, interval: str) -> str:
    price_col = "stripe_monthly_price_id" if interval == "monthly" else "stripe_quarterly_price_id"
    existing_price_id = plan.get(price_col)
    if existing_price_id:
        return existing_price_id

    amount = plan["monthly_price"] if interval == "monthly" else plan["quarterly_price"]
    recurring_interval = "month" if interval == "monthly" else "month"
    interval_count = 1 if interval == "monthly" else 3

    product = stripe.Product.create(
        name=f"SubFlow {plan['name']}",
        description=plan.get("description") or None,
        metadata={"plan_id": plan["id"]},
    )
    price = stripe.Price.create(
        product=product.id,
        unit_amount=amount,
        currency="usd",
        recurring={"interval": recurring_interval, "interval_count": interval_count},
        metadata={"plan_id": plan["id"], "billing_interval": interval},
    )

    supabase_admin.table("plans").update({price_col: price.id}).eq("id", plan["id"]).execute()
    return price.id


def create_checkout_session(customer_id: str, price_id: str, plan_id: str, interval: str) -> str:
    session = stripe.checkout.Session.create(
        customer=customer_id,
        mode="subscription",
        line_items=[{"price": price_id, "quantity": 1}],
        success_url=f"{settings.FRONTEND_URL}/dashboard/checkout/success?session_id={{CHECKOUT_SESSION_ID}}",
        cancel_url=f"{settings.FRONTEND_URL}/dashboard/plans",
        metadata={"plan_id": plan_id, "billing_interval": interval},
        subscription_data={"metadata": {"plan_id": plan_id, "billing_interval": interval}},
    )
    return session.url or ""


def create_portal_session(customer_id: str) -> str:
    session = stripe.billing_portal.Session.create(
        customer=customer_id,
        return_url=f"{settings.FRONTEND_URL}/dashboard/subscription",
    )
    return session.url
