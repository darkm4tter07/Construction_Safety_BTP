import torch
import threading
from ultralytics import YOLO
from . import torch_patch

class YOLODetector:
    def __init__(self, model_path: str, device: str = None):
        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")
        print(f"Using device: {self.device}")
        self.model = YOLO(model_path)
        self._lock = threading.Lock()  # prevent concurrent calls

    def set_device(self, device: str):
        self.device = device
        print(f"Switched YOLO device to: {self.device}")

    def detect(self, frame):
        """Run YOLO tracking on a frame and return detections with track IDs"""
        with self._lock:
            results = self.model.track(
                frame,
                device=self.device,
                persist=True,
                tracker="botsort.yaml",
                verbose=False,
                conf=0.1
            )
        detections = []
        for det in results[0].boxes:
            x1, y1, x2, y2 = det.xyxy[0].cpu().numpy()
            conf = float(det.conf[0])
            cls = int(det.cls[0])
            track_id = int(det.id[0]) if det.id is not None else None

            detections.append({
                "bbox": [int(x1), int(y1), int(x2), int(y2)],
                "conf": conf,
                "class_id": cls,
                "track_id": track_id
            })
        return detections