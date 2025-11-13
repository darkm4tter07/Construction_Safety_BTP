from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import websocket, upload, health
from app.core.config import settings
from app.models import safety_monitor


app = FastAPI(title=settings.APP_NAME, version=settings.VERSION)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(health.router)
app.include_router(upload.router)
app.include_router(websocket.router)


@app.on_event("shutdown")
async def shutdown_event():
    safety_monitor.cleanup()