from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field


BillingInterval = Literal["monthly", "quarterly"]
SubscriptionStatus = Literal["active", "canceled", "past_due", "trialing", "expired"]
InvoiceStatus = Literal["paid", "pending", "failed"]


class Plan(BaseModel):
    id: str
    name: str
    description: str
    features: list[str]
    monthly_price: int
    quarterly_price: int
    is_active: bool
    sort_order: int


class Profile(BaseModel):
    id: str
    full_name: str
    email: EmailStr
    avatar_url: str | None = None
    is_admin: bool
    created_at: datetime


class ProfileUpdate(BaseModel):
    full_name: str | None = None
    avatar_url: str | None = None


class Subscription(BaseModel):
    id: str
    user_id: str
    plan_id: str
    status: SubscriptionStatus
    billing_interval: BillingInterval
    current_period_start: datetime | None = None
    current_period_end: datetime | None = None
    cancel_at_period_end: bool
    created_at: datetime


class SubscriptionWithPlan(Subscription):
    plan: Plan | None = None


class Invoice(BaseModel):
    id: str
    subscription_id: str | None = None
    user_id: str
    stripe_invoice_id: str | None = None
    amount: int
    currency: str
    status: InvoiceStatus
    invoice_date: datetime
    paid_at: datetime | None = None


class MeResponse(BaseModel):
    profile: Profile
    subscription: SubscriptionWithPlan | None = None


class CheckoutRequest(BaseModel):
    plan_id: str
    billing_interval: BillingInterval


class CheckoutResponse(BaseModel):
    url: str


class PortalResponse(BaseModel):
    url: str


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    conversation_history: list[ChatMessage] = []


class ChatResponse(BaseModel):
    reply: str


class PaginatedInvoices(BaseModel):
    items: list[Invoice]
    total: int
    page: int
    per_page: int
