import cv2, base64, numpy as np
import asyncio, threading, time, traceback
from app.models import safety_monitor

cctv_active = {}
cctv_threads = {}

def cctv_stream_thread(client_id: int, video_path: str, websocket, manager, loop):
    cap = cv2.VideoCapture(video_path)

    if not cap.isOpened():
        print(f"❌ Failed to open video: {video_path}")
        asyncio.run_coroutine_threadsafe(
            manager.send_json({"type": "error", "message": f"Failed to open video: {video_path}"}, websocket),
            loop
        )
        return

    print(f"✅ CCTV stream started: {video_path}")

    while cctv_active.get(client_id, False):
        ret, frame = cap.read()
        if not ret:
            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
            continue

        time.sleep(0.1)

        try:
            result = safety_monitor.process_frame(frame)

            _, buf1 = cv2.imencode(".jpg", result["object_frame"], [cv2.IMWRITE_JPEG_QUALITY, 60])
            frame_object_b64 = base64.b64encode(buf1).decode("utf-8")

            _, buf2 = cv2.imencode(".jpg", result["pose_frame"], [cv2.IMWRITE_JPEG_QUALITY, 60])
            frame_pose_b64 = base64.b64encode(buf2).decode("utf-8")

            asyncio.run_coroutine_threadsafe(
                manager.send_json(
                    {
                        "type": "result",
                        "frame_object": f"data:image/jpeg;base64,{frame_object_b64}",
                        "frame_pose": f"data:image/jpeg;base64,{frame_pose_b64}",
                        "detections": result["detections"],
                        "posture": result["posture"],
                        "fps": result["fps"],
                        "source": "cctv",
                    },
                    websocket,
                ),
                loop
            )
        except Exception as e:
            print(f"❌ CCTV frame error: {e}")
            traceback.print_exc()

    cap.release()
    print(f"🛑 CCTV stream stopped for client {client_id}")


def start_cctv(client_id, video_path, websocket, manager, loop):
    if cctv_active.get(client_id, False):
        return False  # already running
    cctv_active[client_id] = True
    thread = threading.Thread(
        target=cctv_stream_thread,
        args=(client_id, video_path, websocket, manager, loop),
        daemon=True
    )
    cctv_threads[client_id] = thread
    thread.start()
    return True


def stop_cctv(client_id):
    cctv_active[client_id] = False


def cleanup_cctv(client_id):
    cctv_active.pop(client_id, None)
    cctv_threads.pop(client_id, None)