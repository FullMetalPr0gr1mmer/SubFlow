from fastapi import APIRouter, Depends, HTTPException

from app.dependencies import CurrentUser, get_current_user
from app.models.schemas import ProfileUpdate
from app.services.supabase_service import (
    get_active_subscription,
    get_profile,
    supabase_admin,
)

router = APIRouter()


@router.get("/me")
def me(user: CurrentUser = Depends(get_current_user)):
    profile = get_profile(user.id)
    if not profile:
        raise HTTPException(404, "Profile not found")
    subscription = get_active_subscription(user.id)
    return {"profile": profile, "subscription": subscription}


@router.put("/profile")
def update_profile(
    body: ProfileUpdate,
    user: CurrentUser = Depends(get_current_user),
):
    patch: dict = {k: v for k, v in body.model_dump().items() if v is not None}
    if not patch:
        return get_profile(user.id)
    res = supabase_admin.table("profiles").update(patch).eq("id", user.id).execute()
    return res.data[0] if res.data else {}
