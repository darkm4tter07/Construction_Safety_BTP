from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import base64, json, cv2, numpy as np
import traceback
from app.services.websocket_manager import ConnectionManager
from app.models import safety_monitor

router = APIRouter()
manager = ConnectionManager()

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    print("✅ WebSocket client connected")
    
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            print(f"📥 Received message type: {message.get('type')}")

            if message.get("type") == "frame":
                try:
                    frame_data = message["frame"]
                    print(f"Frame data length: {len(frame_data)}")
                    
                    # Decode base64
                    frame_bytes = base64.b64decode(frame_data.split(",")[1])
                    print(f"Decoded bytes length: {len(frame_bytes)}")
                    
                    # Decode image
                    nparr = np.frombuffer(frame_bytes, np.uint8)
                    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                    
                    if frame is None:
                        print("❌ Failed to decode frame")
                        continue
                    
                    print(f"🖼️  Frame shape: {frame.shape}")

                    # Process frame
                    processed_frame, results = safety_monitor.process_frame(frame)
                    print(f"✅ Frame processed successfully")
                    
                    # Encode result
                    _, buffer = cv2.imencode(".jpg", processed_frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
                    frame_base64 = base64.b64encode(buffer).decode("utf-8")

                    await manager.send_json({
                        "type": "result",
                        "frame": f"data:image/jpeg;base64,{frame_base64}",
                        "data": results
                    }, websocket)
                    print(f"📤 Sent result: FPS={results.get('fps', 0)}")
                    
                except Exception as e:
                    print(f"❌ Error processing frame: {e}")
                    traceback.print_exc()
                    # Send error back to client
                    await manager.send_json({
                        "type": "error",
                        "message": str(e)
                    }, websocket)
                
            elif message.get("type") == "ping":
                await websocket.send_json({"type": "pong"})
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        print("❌ WebSocket client disconnected")
    except Exception as e:
        print(f"⚠️  WebSocket error: {e}")
        traceback.print_exc()
        manager.disconnect(websocket)