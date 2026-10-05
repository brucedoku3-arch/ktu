import time
import threading
from collections import defaultdict, deque
from functools import wraps
from typing import Callable, Optional, Tuple

from flask import Flask, Request, abort, flash, jsonify, redirect, request, url_for
from flask_login import current_user


class SlidingWindowRateLimiter:
    """
    Thread-safe in-memory Sliding Window Rate Limiter.
    Enforces precise rolling window quotas per IP address or authenticated student account.
    Computes exact wait seconds until quota capacity is replenished.
    """

    def __init__(self, app: Optional[Flask] = None):
        self._lock = threading.Lock()
        # storage mapping: key -> deque of float timestamps
        self._records = defaultdict(deque)
        self.rules = []
        if app:
            self.init_app(app)

    def init_app(self, app: Flask):
        """Initializes rate limiter middleware and binds error handlers to Flask app."""
        app.extensions = getattr(app, "extensions", {})
        app.extensions["rate_limiter"] = self

        # Global before_request middleware enforcing automatic endpoint limits
        @app.before_request
        def check_global_rate_limits():
            # Skip static assets and internal inspection
            if request.path.startswith("/static") or request.method == "OPTIONS":
                return None

            path = request.path.rstrip("/")
            method = request.method.upper()

            # Rule 1: /auth/login & /auth/register: 5 attempts per minute per IP
            if path in ("/auth/login", "/auth/register") and method == "POST":
                key = f"ip:{self.get_client_ip()}:{path}"
                allowed, wait_sec = self.is_allowed(key, limit=5, window=60)
                if not allowed:
                    return self.make_rate_limit_response(wait_sec, "5 attempts per minute")

            # Rule 2: /feed/create & /feed/confession: 10 submissions per hour per user
            elif path in ("/feed/create", "/feed/confession") and method == "POST":
                user_id = current_user.id if current_user.is_authenticated else self.get_client_ip()
                key = f"user:{user_id}:{path}"
                allowed, wait_sec = self.is_allowed(key, limit=10, window=3600)
                if not allowed:
                    return self.make_rate_limit_response(wait_sec, "10 submissions per hour")

            # Rule 3: /vlogs/create: 5 uploads per hour per user
            elif (path == "/vlogs/create" or path.startswith("/vlogs/create")) and method == "POST":
                user_id = current_user.id if current_user.is_authenticated else self.get_client_ip()
                key = f"user:{user_id}:vlogs_create"
                allowed, wait_sec = self.is_allowed(key, limit=5, window=3600)
                if not allowed:
                    return self.make_rate_limit_response(wait_sec, "5 vlog uploads per hour")

            # Rule 4: /messages/<username>/send & /messages/send: 30 messages per minute per user
            elif ((path.startswith("/messages/") and path.endswith("/send")) or path == "/messages/send") and method == "POST":
                user_id = current_user.id if current_user.is_authenticated else self.get_client_ip()
                key = f"user:{user_id}:dm_send"
                allowed, wait_sec = self.is_allowed(key, limit=30, window=60)
                if not allowed:
                    return self.make_rate_limit_response(wait_sec, "30 messages per minute")

            return None

        # Register standard 429 error handler
        @app.errorhandler(429)
        def handle_429_error(e):
            wait_sec = getattr(e, "description", {}).get("retry_after", 30) if isinstance(getattr(e, "description", None), dict) else 30
            return self.make_rate_limit_response(wait_sec, "system rate limit")

    def get_client_ip(self) -> str:
        """Resolves true client IP from reverse proxy headers (X-Forwarded-For) or remote_addr."""
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        return request.remote_addr or "127.0.0.1"

    def is_allowed(self, key: str, limit: int, window: int) -> Tuple[bool, int]:
        """
        Calculates if request is permitted under sliding window quota.
        Returns: (is_allowed: bool, wait_seconds: int)
        """
        now = time.time()
        cutoff = now - window

        with self._lock:
            timestamps = self._records[key]

            # Evict timestamps older than sliding window cutoff
            while timestamps and timestamps[0] <= cutoff:
                timestamps.popleft()

            if len(timestamps) < limit:
                timestamps.append(now)
                return True, 0

            # Quota exhausted: determine time until oldest recorded hit drops out
            oldest = timestamps[0]
            wait_seconds = max(1, int(oldest + window - now))
            return False, wait_seconds

    def format_wait_time(self, seconds: int) -> str:
        """Formats wait seconds into friendly human-readable phrasing."""
        if seconds < 60:
            return f"{seconds} second{'s' if seconds != 1 else ''}"
        minutes = (seconds + 59) // 60
        return f"{minutes} minute{'s' if minutes != 1 else ''}"

    def make_rate_limit_response(self, wait_seconds: int, quota_desc: str):
        """Constructs standardized 429 Too Many Requests response with human-readable feedback."""
        readable_wait = self.format_wait_time(wait_seconds)
        message = (
            f"Rate limit exceeded ({quota_desc}). "
            f"Too many requests. Please wait {readable_wait} before trying again."
        )

        wants_json_response = (
            request.is_json
            or request.headers.get("X-Requested-With") == "XMLHttpRequest"
            or "application/json" in request.headers.get("Accept", "")
        )

        if wants_json_response:
            response = jsonify({
                "status": "error",
                "error": "rate_limit_exceeded",
                "message": message,
                "retry_after": wait_seconds,
                "quota": quota_desc,
            })
            response.status_code = 429
            response.headers["Retry-After"] = str(wait_seconds)
            return response

        flash(message, "danger")
        referrer = request.referrer or url_for("feed.index")
        response = redirect(referrer)
        response.status_code = 302
        response.headers["Retry-After"] = str(wait_seconds)
        return response

    def limit(self, limit: int, period: int, by: str = "ip"):
        """
        Method decorator for fine-grained per-endpoint rate limits.
        Usage:
            @rate_limiter.limit(limit=5, period=60, by="ip")
            @rate_limiter.limit(limit=10, period=3600, by="user")
        """
        def decorator(f: Callable):
            @wraps(f)
            def wrapped(*args, **kwargs):
                if by == "user" and current_user.is_authenticated:
                    key = f"user:{current_user.id}:{request.endpoint}"
                else:
                    key = f"ip:{self.get_client_ip()}:{request.endpoint}"

                allowed, wait_sec = self.is_allowed(key, limit=limit, window=period)
                if not allowed:
                    return self.make_rate_limit_response(
                        wait_sec, f"{limit} per {self.format_wait_time(period)}"
                    )
                return f(*args, **kwargs)
            return wrapped
        return decorator


# Global singleton instance
rate_limiter = SlidingWindowRateLimiter()
