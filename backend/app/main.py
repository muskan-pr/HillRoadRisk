"""
HillRoadRisk — FastAPI Application Entry Point.

Hyperlocal Landslide Risk Maps for Indian Hilly Terrain.
Pilot region: Uttarakhand.
"""

import structlog
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.api.v1 import segments, villages, landslides

# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer(),
    ],
    wrapper_class=structlog.stdlib.BoundLogger,
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
)

logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown events."""
    logger.info(
        "HillRoadRisk API starting",
        region="Uttarakhand",
        bbox=settings.uttarakhand_bbox,
    )
    yield
    logger.info("HillRoadRisk API shutting down")


# Create FastAPI application
app = FastAPI(
    title="HillRoadRisk API",
    description=(
        "Hyperlocal Landslide Risk Maps for Indian Hilly Terrain.\n\n"
        "Provides road-segment-level and village-level landslide risk scores "
        "for Uttarakhand, updated hourly.\n\n"
        "**Disclaimer**: This is a risk-assessment tool for informational purposes only. "
        "It is not a guarantee of safety."
    ),
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers
app.include_router(segments.router, prefix="/api/v1")
app.include_router(villages.router, prefix="/api/v1")
app.include_router(landslides.router, prefix="/api/v1")


# ============================================
# Root & Health Endpoints
# ============================================

@app.get("/", tags=["Health"])
def root():
    """Root endpoint with API information."""
    return {
        "name": "HillRoadRisk API",
        "version": "0.1.0",
        "description": "Hyperlocal Landslide Risk Maps for Uttarakhand",
        "docs": "/docs",
        "endpoints": {
            "segments": "/api/v1/segments",
            "villages": "/api/v1/villages",
            "landslides": "/api/v1/landslides",
        },
        "disclaimer": "For informational purposes only; not a guarantee of safety.",
    }


@app.get("/health", tags=["Health"])
def health_check():
    """Health check endpoint for monitoring."""
    try:
        from app.database import SessionLocal
        db = SessionLocal()
        db.execute("SELECT 1")
        db.close()
        db_status = "connected"
    except Exception:
        db_status = "disconnected"

    return {
        "status": "healthy",
        "version": "0.1.0",
        "database": db_status,
        "region": "Uttarakhand",
    }


# ============================================
# Error Handlers
# ============================================

@app.exception_handler(404)
async def not_found_handler(request, exc):
    return JSONResponse(
        status_code=404,
        content={"detail": "Resource not found", "docs": "/docs"},
    )


@app.exception_handler(500)
async def server_error_handler(request, exc):
    logger.error("Internal server error", path=str(request.url))
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error. Please try again later."},
    )
