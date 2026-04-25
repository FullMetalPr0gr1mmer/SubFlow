import time

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.services.supabase_service import supabase_admin

bearer_scheme = HTTPBearer(auto_error=False)

_AUTH_CACHE_TTL = 60.0
_auth_cache: dict[str, tuple[float, "CurrentUser"]] = {}


class CurrentUser:
    def __init__(self, user_id: str, email: str, is_admin: bool):
        self.id = user_id
        self.email = email
        self.is_admin = is_admin


def get_current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> CurrentUser:
    if creds is None or creds.scheme.lower() != "bearer":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Missing bearer token")

    token = creds.credentials
    now = time.time()
    cached = _auth_cache.get(token)
    if cached and cached[0] > now:
        return cached[1]

    try:
        result = supabase_admin.auth.get_user(token)
    except Exception as e:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, f"Invalid token: {e}")

    user = getattr(result, "user", None)
    if not user or not user.id:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token did not resolve to a user")

    user_id = user.id
    email = user.email or ""

    profile = (
        supabase_admin.table("profiles")
        .select("is_admin,email")
        .eq("id", user_id)
        .maybe_single()
        .execute()
    )
    is_admin = bool(profile and profile.data and profile.data.get("is_admin"))
    if profile and profile.data and profile.data.get("email"):
        email = profile.data["email"]

    current = CurrentUser(user_id=user_id, email=email, is_admin=is_admin)
    _auth_cache[token] = (now + _AUTH_CACHE_TTL, current)

    if len(_auth_cache) > 256:
        for key in [k for k, (exp, _) in _auth_cache.items() if exp <= now]:
            _auth_cache.pop(key, None)

    return current


def get_admin_user(user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
    if not user.is_admin:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Admin access required")
    return user
