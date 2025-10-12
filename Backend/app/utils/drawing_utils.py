import cv2

def draw_detections(frame, detections, class_names):
    for det in detections:
        x1, y1, x2, y2 = det["bbox"]
        cls = det["class_id"]
        conf = det["conf"]
        color = (0, 255, 0) if class_names[cls].lower() in ["helmet", "vest"] else (0, 0, 255)
        cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
        cv2.putText(frame, f"{class_names[cls]} {conf:.2f}", (x1, y1-10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
    return frame
