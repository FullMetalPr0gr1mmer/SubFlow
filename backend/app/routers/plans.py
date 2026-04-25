from fastapi import APIRouter, HTTPException

from app.services.supabase_service import supabase_admin

router = APIRouter()


@router.get("")
def list_plans():
    res = (
        supabase_admin.table("plans")
        .select("*")
        .eq("is_active", True)
        .order("sort_order")
        .execute()
    )
    return res.data or []


@router.get("/{plan_id}")
def get_plan(plan_id: str):
    res = supabase_admin.table("plans").select("*").eq("id", plan_id).maybe_single().execute()
    if not res.data:
        raise HTTPException(404, "Plan not found")
    return res.data
