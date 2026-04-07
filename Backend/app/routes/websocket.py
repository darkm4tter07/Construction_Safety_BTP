from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import base64, json, cv2, numpy as np
import traceback, time, asyncio
from app.services.websocket_manager import ConnectionManager
from app.services.cctv_service import start_cctv, stop_cctv, cleanup_cctv
from app.models import safety_monitor

router = APIRouter()
manager = ConnectionManager()
last_process_time = {}

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    client_id = id(websocket)
    last_process_time[client_id] = 0
    print("✅ WebSocket client connected")

    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            msg_type = message.get("type")

            # 1. WEBCAM FRAME
            if msg_type == "frame":
                try:
                    current_time = time.time()
                    if current_time - last_process_time[client_id] < 0.1:
                        continue
                    last_process_time[client_id] = current_time

                    frame_bytes = base64.b64decode(message["frame"].split(",")[1])
                    nparr = np.frombuffer(frame_bytes, np.uint8)
                    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                    if frame is None:
                        continue

                    result = safety_monitor.process_frame(frame)

                    _, buf1 = cv2.imencode(".jpg", result["object_frame"], [cv2.IMWRITE_JPEG_QUALITY, 60])
                    _, buf2 = cv2.imencode(".jpg", result["pose_frame"], [cv2.IMWRITE_JPEG_QUALITY, 60])

                    await manager.send_json({
                        "type": "result",
                        "frame_object": f"data:image/jpeg;base64,{base64.b64encode(buf1).decode()}",
                        "frame_pose": f"data:image/jpeg;base64,{base64.b64encode(buf2).decode()}",
                        "detections": result["detections"],
                        "posture": result["posture"],
                        "fps": result["fps"],
                        "source": "webcam",
                    }, websocket)

                except Exception as e:
                    print(f"❌ Frame error: {e}")
                    await manager.send_json({"type": "error", "message": str(e)}, websocket)

            # 2. START CCTV
            elif msg_type == "start_cctv":
                video_path = message.get("path", "app/uploads/test.mp4")
                loop = asyncio.get_event_loop()
                started = start_cctv(client_id, video_path, websocket, manager, loop)
                status = "started" if started else "already_running"
                await manager.send_json({"type": "cctv_status", "status": status, "path": video_path}, websocket)

            # 3. STOP CCTV
            elif msg_type == "stop_cctv":
                stop_cctv(client_id)
                await manager.send_json({"type": "cctv_status", "status": "stopped"}, websocket)

            # 4. PING
            elif msg_type == "ping":
                await websocket.send_json({"type": "pong"})

    except WebSocketDisconnect:
        stop_cctv(client_id)
        cleanup_cctv(client_id)
        last_process_time.pop(client_id, None)
        manager.disconnect(websocket)
        print("❌ WebSocket client disconnected")
    except Exception as e:
        print(f"⚠️ WebSocket error: {e}")
        traceback.print_exc()
        stop_cctv(client_id)
        cleanup_cctv(client_id)
        last_process_time.pop(client_id, None)
        manager.disconnect(websocket)