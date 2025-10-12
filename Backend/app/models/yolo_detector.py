import torch
from ultralytics import YOLO
from . import torch_patch  # Import patch before YOLO usage

class YOLODetector:
    def __init__(self, model_path: str):
        self.model = YOLO(model_path)
    
    def detect(self, frame):
        """Run YOLO on a frame and return detections"""
        results = self.model(frame, verbose=False)
        detections = []
        for det in results[0].boxes:
            x1, y1, x2, y2 = det.xyxy[0].cpu().numpy()
            conf = float(det.conf[0])
            cls = int(det.cls[0])
            detections.append({
                "bbox": [int(x1), int(y1), int(x2), int(y2)],
                "conf": conf,
                "class_id": cls
            })
        return detections