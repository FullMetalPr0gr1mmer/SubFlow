from fastapi import APIRouter, Depends, Query

from app.dependencies import CurrentUser, get_current_user
from app.services.supabase_service import supabase_admin

router = APIRouter()


@router.get("")
def list_invoices(
    user: CurrentUser = Depends(get_current_user),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
):
    start = (page - 1) * per_page
    end = start + per_page - 1

    res = (
        supabase_admin.table("invoices")
        .select("*, subscription:subscriptions(plan:plans(name))", count="exact")
        .eq("user_id", user.id)
        .order("invoice_date", desc=True)
        .range(start, end)
        .execute()
    )
    return {
        "items": res.data or [],
        "total": res.count or 0,
        "page": page,
        "per_page": per_page,
    }
