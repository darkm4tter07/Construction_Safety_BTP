from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.routes import auth, health, upload, websocket, fitness

app = FastAPI(title=settings.APP_NAME, version=settings.VERSION)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(health.router, tags=["Health"])
app.include_router(upload.router, tags=["Upload"])
app.include_router(websocket.router, tags=["WebSocket"])
app.include_router(fitness.router, prefix="/fitness", tags=["Fitness"])

@app.on_event("shutdown")
async def shutdown_event():
    from app.models.safety_monitor import safety_monitor
    safety_monitor.cleanup()