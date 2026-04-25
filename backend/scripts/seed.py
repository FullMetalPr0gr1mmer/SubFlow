"""Seed demo users, subscriptions, and invoices into Supabase.

Run from the backend dir with the venv active:
    python -m scripts.seed

Idempotent-ish: if a fake email already exists in auth.users, the user is reused.
Subscriptions and invoices are appended each run, so re-running multiplies data.
"""
from __future__ import annotations

import random
import uuid
from datetime import datetime, timedelta, timezone

from app.config import settings
from app.services.supabase_service import supabase_admin

USER_COUNT = 60
SEED_PASSWORD = "DemoPassword123!"
DEMO_DOMAIN = "demo.subflow.test"

FIRST_NAMES = [
    "Ada", "Grace", "Linus", "Margaret", "Alan", "Hedy", "Donald", "Edsger",
    "Barbara", "Tim", "Brian", "Ken", "Dennis", "Bjarne", "Guido", "James",
    "Anders", "Rich", "Yukihiro", "Larry", "John", "Sandi", "Brendan", "Anita",
    "Karen", "Radia", "Sophie", "Marie", "Vint", "Doug",
]
LAST_NAMES = [
    "Lovelace", "Hopper", "Torvalds", "Hamilton", "Turing", "Lamarr", "Knuth",
    "Dijkstra", "Liskov", "Berners-Lee", "Kernighan", "Thompson", "Ritchie",
    "Stroustrup", "van Rossum", "Gosling", "Hejlsberg", "Hickey", "Matsumoto",
    "Wall", "Carmack", "Metz", "Eich", "Borg", "Sparck-Jones", "Perlman",
    "Wilkes", "Curie", "Cerf", "Engelbart",
]


def _full_name(seed: int) -> tuple[str, str]:
    rng = random.Random(seed)
    first = rng.choice(FIRST_NAMES)
    last = rng.choice(LAST_NAMES)
    full = f"{first} {last}"
    email_local = f"{first.lower()}.{last.lower().replace(' ', '')}"
    return full, f"{email_local}+{seed}@{DEMO_DOMAIN}"


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _pick_plan(plans: list[dict]) -> dict:
    bucket = random.random()
    if bucket < 0.40:
        return next(p for p in plans if p["name"] == "Starter")
    if bucket < 0.75:
        return next(p for p in plans if p["name"] == "Professional")
    return next(p for p in plans if p["name"] == "Enterprise")


def _pick_status() -> str:
    bucket = random.random()
    if bucket < 0.80:
        return "active"
    if bucket < 0.90:
        return "canceled"
    if bucket < 0.95:
        return "past_due"
    return "expired"


def _create_or_get_user(email: str, full_name: str) -> str | None:
    try:
        result = supabase_admin.auth.admin.create_user(
            {
                "email": email,
                "password": SEED_PASSWORD,
                "email_confirm": True,
                "user_metadata": {"full_name": full_name},
            }
        )
        return result.user.id  # type: ignore[union-attr]
    except Exception as e:
        msg = str(e).lower()
        if "already" in msg or "exists" in msg or "registered" in msg:
            existing = supabase_admin.auth.admin.list_users()
            users = getattr(existing, "users", existing)
            for u in users or []:
                u_email = getattr(u, "email", None) or (u.get("email") if isinstance(u, dict) else None)
                if u_email == email:
                    return getattr(u, "id", None) or u.get("id")
            return None
        print(f"  ! create_user failed for {email}: {e}")
        return None


def main() -> None:
    print(f"Seeding {USER_COUNT} demo users into {settings.SUPABASE_URL}…")

    plans_resp = supabase_admin.table("plans").select("*").order("sort_order").execute()
    plans = plans_resp.data or []
    if len(plans) < 3:
        raise SystemExit("Plans table is empty. Run supabase/schema.sql first.")

    random.seed(42)
    created = 0
    for i in range(USER_COUNT):
        full_name, email = _full_name(i)
        created_at = _now() - timedelta(days=random.randint(7, 240))

        user_id = _create_or_get_user(email, full_name)
        if not user_id:
            continue

        supabase_admin.table("profiles").update(
            {"full_name": full_name, "created_at": created_at.isoformat()}
        ).eq("id", user_id).execute()

        plan = _pick_plan(plans)
        interval = "monthly" if random.random() < 0.70 else "quarterly"
        status = _pick_status()
        period_days = 30 if interval == "monthly" else 90
        period_end = created_at + timedelta(days=period_days)

        sub_id = str(uuid.uuid4())
        supabase_admin.table("subscriptions").insert(
            {
                "id": sub_id,
                "user_id": user_id,
                "plan_id": plan["id"],
                "status": status,
                "billing_interval": interval,
                "current_period_start": created_at.isoformat(),
                "current_period_end": period_end.isoformat(),
                "cancel_at_period_end": status == "canceled",
                "created_at": created_at.isoformat(),
            }
        ).execute()

        if status in {"active", "canceled", "past_due"}:
            invoice_count = random.randint(3, 6)
            amount = plan["monthly_price"] if interval == "monthly" else plan["quarterly_price"]
            for n in range(invoice_count):
                inv_date = created_at + timedelta(days=period_days * n)
                if inv_date > _now():
                    break
                inv_status = "paid" if random.random() < 0.92 else "failed"
                supabase_admin.table("invoices").insert(
                    {
                        "subscription_id": sub_id,
                        "user_id": user_id,
                        "amount": amount,
                        "currency": "usd",
                        "status": inv_status,
                        "invoice_date": inv_date.isoformat(),
                        "paid_at": inv_date.isoformat() if inv_status == "paid" else None,
                    }
                ).execute()

        created += 1
        if created % 10 == 0:
            print(f"  · seeded {created}/{USER_COUNT}")

    print(f"Done. Seeded {created} users.")
    print(f"Demo password (all seeded users): {SEED_PASSWORD}")
    print("Note: these accounts share the demo password — they're for chart/data realism only.")


if __name__ == "__main__":
    main()
