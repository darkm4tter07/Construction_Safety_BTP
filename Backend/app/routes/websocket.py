from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import base64, json, cv2, numpy as np
import traceback
from app.services.websocket_manager import ConnectionManager
from app.models import safety_monitor

router = APIRouter()
manager = ConnectionManager()

# Track last frame time to prevent buffering
last_process_time = {}

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """Handles streaming frames from frontend → backend → AI → frontend."""
    await manager.connect(websocket)
    client_id = id(websocket)
    last_process_time[client_id] = 0
    print("✅ WebSocket client connected")

    try:
        while True:
            # Receive message from frontend
            data = await websocket.receive_text()
            message = json.loads(data)
            msg_type = message.get("type")

            # -----------------------------------------------
            # 1. FRAME PROCESSING REQUEST
            # -----------------------------------------------
            if msg_type == "frame":
                try:
                    # Skip frame if backend is still processing previous one
                    import time
                    current_time = time.time()
                    if current_time - last_process_time[client_id] < 0.1:  # 100ms minimum gap
                        continue
                    
                    last_process_time[client_id] = current_time
                    
                    frame_data = message["frame"]

                    # ---------------------------
                    # Decode base64 → OpenCV frame
                    # ---------------------------
                    frame_bytes = base64.b64decode(frame_data.split(",")[1])
                    nparr = np.frombuffer(frame_bytes, np.uint8)
                    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

                    if frame is None:
                        print("❌ Failed to decode frame")
                        continue

                    # ---------------------------
                    # Run YOLO + Mediapipe + RULA/REBA
                    # ---------------------------
                    result = safety_monitor.process_frame(frame)

                    # ---------------------------
                    # Encode OBJECT frame
                    # ---------------------------
                    _, buf1 = cv2.imencode(
                        ".jpg",
                        result["object_frame"],
                        [cv2.IMWRITE_JPEG_QUALITY, 60],  
                    )
                    frame_object_b64 = base64.b64encode(buf1).decode("utf-8")

                    # ---------------------------
                    # Encode POSE frame
                    # ---------------------------
                    _, buf2 = cv2.imencode(
                        ".jpg",
                        result["pose_frame"],
                        [cv2.IMWRITE_JPEG_QUALITY, 60],
                    )
                    frame_pose_b64 = base64.b64encode(buf2).decode("utf-8")

                    # ---------------------------
                    # Send combined result (non-blocking)
                    # ---------------------------
                    await manager.send_json(
                        {
                            "type": "result",
                            "frame_object": f"data:image/jpeg;base64,{frame_object_b64}",
                            "frame_pose": f"data:image/jpeg;base64,{frame_pose_b64}",
                            "detections": result["detections"],
                            "posture": result["posture"],
                            "fps": result["fps"],
                        },
                        websocket,
                    )

                except Exception as e:
                    print(f"❌ Error processing frame: {e}")
                    traceback.print_exc()
                    await manager.send_json(
                        {"type": "error", "message": str(e)}, websocket
                    )

            # -----------------------------------------------
            # 2. HEALTH PING
            # -----------------------------------------------
            elif msg_type == "ping":
                await websocket.send_json({"type": "pong"})

    except WebSocketDisconnect:
        if client_id in last_process_time:
            del last_process_time[client_id]
        manager.disconnect(websocket)
        print("❌ WebSocket client disconnected")
    except Exception as e:
        print(f"⚠️ WebSocket error: {e}")
        traceback.print_exc()
        if client_id in last_process_time:
            del last_process_time[client_id]
        manager.disconnect(websocket)