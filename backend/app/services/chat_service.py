from __future__ import annotations

import httpx

from app.config import settings
from app.services.supabase_service import get_active_subscription, get_profile

GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models"

SYSTEM_PROMPT = """You are a friendly, professional support assistant for SubFlow, a SaaS subscription platform.

You help users with:
- Understanding plan features and pricing (Starter $9/mo or $24/quarter; Professional $29/mo or $78/quarter; Enterprise $99/mo or $267/quarter)
- Billing questions (monthly vs quarterly billing — quarterly saves ~10%)
- Subscription management (upgrading, downgrading, canceling)
- Account and general platform questions

Rules:
- Be concise and helpful (2-3 sentences max per response)
- If asked about things outside your scope, politely redirect
- For complex issues like refunds, suggest contacting human support
- Never make up features that don't exist
- Use the user's name naturally but don't overdo it"""


def _build_user_context(user_id: str) -> str:
    profile = get_profile(user_id) or {}
    sub = get_active_subscription(user_id) or {}
    plan = sub.get("plan") or {}

    lines = [
        f"- Name: {profile.get('full_name') or 'there'}",
        f"- Current Plan: {plan.get('name') or 'No active plan'}",
        f"- Subscription Status: {sub.get('status') or 'None'}",
        f"- Billing Interval: {sub.get('billing_interval') or 'N/A'}",
        f"- Next Billing Date: {sub.get('current_period_end') or 'N/A'}",
    ]
    return "Current user context:\n" + "\n".join(lines)


def _to_gemini_contents(history: list[dict], new_user_message: str) -> list[dict]:
    """Gemini uses 'user' / 'model' roles (not 'assistant') and parts/text structure."""
    contents: list[dict] = []
    for msg in history:
        role = "model" if msg.get("role") == "assistant" else "user"
        contents.append({"role": role, "parts": [{"text": msg.get("content", "")}]})
    contents.append({"role": "user", "parts": [{"text": new_user_message}]})
    return contents


async def generate_reply(
    user_id: str,
    message: str,
    conversation_history: list[dict],
) -> str:
    if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY.startswith("PLACEHOLDER"):
        return "Chat is disabled: the Gemini API key hasn't been configured yet."

    user_context = _build_user_context(user_id)
    full_system = f"{SYSTEM_PROMPT}\n\n{user_context}"

    url = f"{GEMINI_BASE}/{settings.GEMINI_MODEL}:generateContent"
    payload = {
        "system_instruction": {"parts": [{"text": full_system}]},
        "contents": _to_gemini_contents(conversation_history, message),
        "generationConfig": {
            "temperature": 0.6,
            "maxOutputTokens": 400,
        },
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                url,
                headers={"Content-Type": "application/json"},
                params={"key": settings.GEMINI_API_KEY},
                json=payload,
            )
            resp.raise_for_status()
            data = resp.json()
            candidates = data.get("candidates") or []
            if not candidates:
                return "I didn't receive a response. Please try again."
            parts = (candidates[0].get("content") or {}).get("parts") or []
            text = "".join(p.get("text", "") for p in parts).strip()
            return text or "I didn't receive a response. Please try again."
    except httpx.HTTPStatusError as e:
        try:
            detail = e.response.json().get("error", {}).get("message", "")
        except Exception:
            detail = e.response.text[:200] if e.response else str(e)
        return f"The assistant is unavailable right now ({detail[:120]})."
    except Exception:
        return "Sorry, I'm having trouble connecting. Please try again in a moment."
