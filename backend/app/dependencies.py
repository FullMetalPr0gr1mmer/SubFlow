import time

import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import settings
from app.services.supabase_service import supabase_admin

bearer_scheme = HTTPBearer(auto_error=False)

_AUTH_CACHE_TTL = 60.0
_auth_cache: dict[str, tuple[float, "CurrentUser"]] = {}

# Direct httpx client for Supabase auth validation. Short keepalive expiry so
# idle connections get dropped before Render's free-tier network kills them.
_auth_http = httpx.Client(
    timeout=httpx.Timeout(10.0, connect=5.0),
    http2=False,
    limits=httpx.Limits(max_keepalive_connections=10, keepalive_expiry=5.0),
)


def _validate_token(token: str) -> dict | None:
    """Hit Supabase /auth/v1/user with the user's bearer token. Returns the user
    dict on 200, None otherwise. Retries once on transient httpx errors so a
    stale connection doesn't fail the request."""
    url = f"{settings.SUPABASE_URL}/auth/v1/user"
    headers = {
        "Authorization": f"Bearer {token}",
        "apikey": settings.SUPABASE_SERVICE_ROLE_KEY,
    }
    last_err: Exception | None = None
    for _ in range(2):
        try:
            resp = _auth_http.get(url, headers=headers)
            if resp.status_code == 200:
                return resp.json()
            return None
        except httpx.HTTPError as e:
            last_err = e
            time.sleep(0.05)
    raise HTTPException(
        status.HTTP_503_SERVICE_UNAVAILABLE,
        f"Auth backend unreachable: {last_err}",
    )


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

    user_data = _validate_token(token)
    if not user_data or not user_data.get("id"):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid token")

    user_id = user_data["id"]
    email = user_data.get("email") or ""

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
