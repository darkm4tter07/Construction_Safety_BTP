import torch
from ultralytics import YOLO
from . import torch_patch  # Ensure patch is imported

class YOLODetector:
    def __init__(self, model_path: str, device: str = None):
        # Set device automatically if not provided
        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")
        print(f"Using device: {self.device}")
        self.model = YOLO(model_path)

    def set_device(self, device: str):
        """Switch device at runtime"""
        self.device = device
        print(f"Switched YOLO device to: {self.device}")

    def detect(self, frame):
        """Run YOLO on a frame and return detections"""
        results = self.model(frame, device=self.device, verbose=False)
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
