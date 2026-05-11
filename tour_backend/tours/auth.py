from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple

import jwt
from django.conf import settings
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed

from .models import User


@dataclass(frozen=True)
class JWTPayload:
    user_id: int


def _decode_token(token: str) -> JWTPayload:
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=["HS256"],
            options={"require": ["exp", "sub"]},
        )
    except jwt.ExpiredSignatureError as exc:
        raise AuthenticationFailed("Token expired.") from exc
    except jwt.InvalidTokenError as exc:
        raise AuthenticationFailed("Invalid token.") from exc

    try:
        user_id = int(payload["sub"])
    except Exception as exc:  # noqa: BLE001
        raise AuthenticationFailed("Invalid token payload.") from exc

    return JWTPayload(user_id=user_id)


def create_access_token(*, user: User, expires_in: timedelta | None = None) -> str:
    if expires_in is None:
        expires_in = timedelta(days=7)

    now = datetime.now(timezone.utc)
    exp = now + expires_in
    payload = {
        "sub": str(user.id),
        "iat": int(now.timestamp()),
        "exp": int(exp.timestamp()),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")


class JWTAuthentication(BaseAuthentication):
    keyword = "Bearer"

    def authenticate_header(self, request) -> str:
        # Enables DRF to return 401 (not 403) when authentication is required.
        return self.keyword

    def authenticate(self, request) -> Optional[Tuple[User, None]]:
        auth = request.headers.get("Authorization") or ""
        if not auth:
            return None

        parts = auth.split()
        if len(parts) != 2 or parts[0] != self.keyword:
            return None

        payload = _decode_token(parts[1])
        try:
            user = User.objects.get(id=payload.user_id)
        except User.DoesNotExist as exc:
            raise AuthenticationFailed("User not found.") from exc

        return (user, None)
