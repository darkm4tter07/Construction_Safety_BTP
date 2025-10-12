from fastapi import APIRouter, UploadFile, File
from fastapi.responses import StreamingResponse
from app.models import safety_monitor
import os, cv2

router = APIRouter()

@router.post("/upload")
async def upload_video(file: UploadFile = File(...)):
    os.makedirs("app/uploads", exist_ok=True)
    path = os.path.join("app/uploads", file.filename)
    with open(path, "wb") as f:
        f.write(await file.read())
    return {"status": "success", "filename": file.filename}

@router.get("/process/{filename}")
async def process_video(filename: str):
    path = os.path.join("app/uploads", filename)
    if not os.path.exists(path):
        return {"error": "file not found"}

    def stream():
        for frame, _ in safety_monitor.process_video_stream(path):
            _, buf = cv2.imencode(".jpg", frame)
            yield (b"--frame\r\nContent-Type: image/jpeg\r\n\r\n" + buf.tobytes() + b"\r\n")

    return StreamingResponse(stream(), media_type="multipart/x-mixed-replace; boundary=frame")
