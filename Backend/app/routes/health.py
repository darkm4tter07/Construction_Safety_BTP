from fastapi import APIRouter
from app.models import safety_monitor
router = APIRouter()

@router.get("/")
async def root():
    return {"message": "Construction Safety Monitor API"}

@router.get("/health")
async def health():
    return {
        "status": "healthy",
        "yolo_model_loaded": safety_monitor.yolo is not None,
        "mediapipe_loaded": safety_monitor.pose_detector.pose is not None
    }
