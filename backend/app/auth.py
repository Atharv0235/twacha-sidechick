"""
Accounts: password hashing (bcrypt), signed access tokens (JWT, HS256) and the FastAPI dependency
that turns "Authorization: Bearer <token>" into a User row.

Settings (environment):
  JWT_SECRET_KEY               REQUIRED in production. Without it a random key is made at start-up, which
                               works but logs everybody out whenever the server restarts.
  ACCESS_TOKEN_EXPIRE_MINUTES  default 10080 (7 days)
  BCRYPT_ROUNDS                default 12 (only lower it in tests)

Not built (needs an email service): email verification and "forgot password".
"""
import logging
import os
import secrets
import threading
import time
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from .database import get_db

log = logging.getLogger("twacha.auth")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "10080"))


def _load_secret() -> str:
    key = os.getenv("JWT_SECRET_KEY", "").strip()
    if len(key) >= 32:
        return key
    if key:
        log.warning("JWT_SECRET_KEY is shorter than 32 characters; ignoring it and using a random key.")
    else:
        log.warning("JWT_SECRET_KEY is not set: using a random key. Everyone is logged out on each restart. "
                    "Set a long random value in the hosting dashboard.")
    return secrets.token_urlsafe(48)


SECRET_KEY = _load_secret()


# ── Passwords ────────────────────────────────────────────────────────────────

def hash_password(password: str) -> str:
    rounds = int(os.getenv("BCRYPT_ROUNDS", "12"))
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt(rounds)).decode("ascii")


def verify_password(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("ascii"))
    except ValueError:      # malformed hash or over-long password
        return False


# Used when the email is unknown, so "no such user" takes as long as "wrong password".
_DUMMY_HASH = None


def burn_password_time(password: str) -> None:
    global _DUMMY_HASH
    if _DUMMY_HASH is None:
        _DUMMY_HASH = hash_password("not-a-real-password")
    verify_password(password, _DUMMY_HASH)


# ── Tokens ───────────────────────────────────────────────────────────────────

def create_access_token(user_id: int, token_version: int) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),                 # PyJWT requires a string subject
        "tv": token_version,
        "iat": now,
        "exp": now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def _unauthorized(detail: str = "Please log in again.") -> HTTPException:
    return HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=detail,
                         headers={"WWW-Authenticate": "Bearer"})


_bearer = HTTPBearer(auto_error=False)


def get_current_user(creds: HTTPAuthorizationCredentials | None = Depends(_bearer),
                     db: Session = Depends(get_db)):
    """Dependency: the logged-in User, or 401."""
    from .models import User        # avoid a circular import
    if creds is None or not creds.credentials:
        raise _unauthorized("Please log in.")
    try:
        payload = jwt.decode(creds.credentials, SECRET_KEY, algorithms=[ALGORITHM],
                             options={"require": ["exp", "sub"]})
        user_id = int(payload["sub"])
    except (jwt.PyJWTError, ValueError, KeyError):
        raise _unauthorized("Your session has expired. Please log in again.")
    user = db.get(User, user_id)
    if user is None or int(payload.get("tv", -1)) != user.token_version:
        raise _unauthorized("Your session has expired. Please log in again.")
    return user


# ── Login throttle (in memory: fine for one server process) ──────────────────

_MAX_FAILURES = int(os.getenv("LOGIN_MAX_FAILURES", "8"))
_WINDOW_SECONDS = 15 * 60
_failures: dict[str, list[float]] = {}
_lock = threading.Lock()


def _recent(key: str, now: float) -> list[float]:
    kept = [t for t in _failures.get(key, []) if now - t < _WINDOW_SECONDS]
    if kept:
        _failures[key] = kept
    else:
        _failures.pop(key, None)
    return kept


def check_login_allowed(key: str) -> None:
    with _lock:
        if len(_recent(key, time.time())) >= _MAX_FAILURES:
            raise HTTPException(status_code=429, detail="Too many wrong attempts. Please wait 15 minutes and try again.")


def record_login_failure(key: str) -> None:
    with _lock:
        now = time.time()
        _recent(key, now)
        _failures.setdefault(key, []).append(now)


def clear_login_failures(key: str) -> None:
    with _lock:
        _failures.pop(key, None)
