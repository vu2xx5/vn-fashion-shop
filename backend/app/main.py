"""
Diem vao chinh cua ung dung VN Fashion Shop API.
"""

import logging
from contextlib import asynccontextmanager
from collections.abc import AsyncIterator

import redis.asyncio as aioredis
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.config import get_settings
from app.database import engine, Base, async_session_factory
from app.dependencies import limiter
from app.middleware.security import SecurityHeadersMiddleware
from app.routers import register_routers

settings = get_settings()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """
    Quan ly vong doi ung dung:
    - Startup: Ket noi Redis, khoi tao tai nguyen
    - Shutdown: Dong ket noi
    """
    # --- Startup ---
    logger.info("Dang khoi dong VN Fashion Shop API...")

    # Ket noi Redis
    redis_client = aioredis.from_url(
        settings.REDIS_URL,
        encoding="utf-8",
        decode_responses=True,
    )
    app.state.redis = redis_client

    try:
        await redis_client.ping()
        logger.info("Ket noi Redis thanh cong")
    except Exception as e:
        logger.warning("Khong the ket noi Redis: %s. Tiep tuc khong co cache.", e)

    # Tao bang va seed du lieu mau neu chua co
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Da dam bao cac bang ton tai")

        # Auto-seed neu chua co du lieu
        from sqlalchemy import select, func
        from app.models.user import User
        async with async_session_factory() as db:
            result = await db.execute(select(func.count()).select_from(User))
            user_count = result.scalar() or 0
            if user_count == 0:
                logger.info("Database trong, dang seed du lieu mau...")
                from seed.seed_data import main as seed_main
                await seed_main()
                logger.info("Seed du lieu thanh cong")
            else:
                logger.info("Database da co %d users, bo qua seed", user_count)
    except Exception as e:
        logger.warning("Loi khi seed du lieu: %s", e)

    yield

    # --- Shutdown ---
    logger.info("Dang tat VN Fashion Shop API...")
    if hasattr(app.state, "redis") and app.state.redis:
        await app.state.redis.close()
        logger.info("Da dong ket noi Redis")


app = FastAPI(
    title="VN Fashion Shop API",
    description="API backend cho cua hang thoi trang truc tuyen Viet Nam",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# --- Middleware ---

# Security headers (added first = inner middleware)
app.add_middleware(SecurityHeadersMiddleware)

# CORS (added last = outer middleware, runs first)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Total-Count"],
)

# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


# --- Exception handler toan cuc ---

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.error("Loi khong xu ly duoc: %s", exc, exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Loi he thong noi bo. Vui long thu lai sau."},
    )


# --- Health check ---

@app.get("/health", tags=["Health"])
async def health_check():
    """Kiem tra trang thai he thong."""
    return {"status": "ok", "version": settings.APP_VERSION}


# --- Register routers ---
register_routers(app)


@app.get("/", tags=["Health"])
async def root():
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": "/docs",
    }
