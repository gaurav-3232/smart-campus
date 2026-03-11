from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.routes import auth, resources, bookings, analytics

app = FastAPI(
    title="Smart Campus Resource Booking",
    description="Microservice-based booking system for campus resources with RBAC and analytics",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(resources.router)
app.include_router(bookings.router)
app.include_router(analytics.router)


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "healthy", "service": "smart-campus-booking"}
