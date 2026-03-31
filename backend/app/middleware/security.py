"""
Middleware bao mat - Them cac security headers vao moi response.
"""

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Them cac HTTP security headers de bao ve chong lai cac tan cong pho bien:
    - XSS, Clickjacking, MIME sniffing, v.v.
    """

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        response = await call_next(request)

        # Chong MIME-type sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"

        # Chong Clickjacking
        response.headers["X-Frame-Options"] = "DENY"

        # Kich hoat bo loc XSS cua trinh duyet
        response.headers["X-XSS-Protection"] = "1; mode=block"

        # Khong gui Referer khi chuyen tu HTTPS sang HTTP
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # Chi cho phep HTTPS (bat sau khi co chung chi SSL)
        # response.headers["Strict-Transport-Security"] = (
        #     "max-age=31536000; includeSubDomains"
        # )

        # Content Security Policy co ban
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "img-src 'self' https: data:; "
            "style-src 'self' 'unsafe-inline'"
        )

        # Khong cho phep trinh duyet su dung cac tinh nang nguy hiem
        response.headers["Permissions-Policy"] = (
            "camera=(), microphone=(), geolocation=()"
        )

        return response
