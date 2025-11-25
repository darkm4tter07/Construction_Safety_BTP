# import cv2

# def draw_detections(frame, detections, class_names):
#     for det in detections:
#         x1, y1, x2, y2 = det["bbox"]
#         cls = det["class_id"]
#         conf = det["conf"]
#         color = (0, 255, 0) if class_names[cls].lower() in ["helmet", "vest"] else (0, 0, 255)
#         cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
#         cv2.putText(frame, f"{class_names[cls]} {conf:.2f}", (x1, y1-10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
#     return frame

import cv2

def draw_detections(frame, detections, class_names):

    # Class Groups
    positive_classes = ["hardhat", "helmet", "mask", "safety vest", "vest"]
    negative_classes = ["no-hardhat", "no-mask", "no-safety vest", "no-vest"]
    
    for det in detections:
        x1, y1, x2, y2 = map(int, det["bbox"])
        cls = det["class_id"]
        conf = det.get("conf", 0)
        
        class_name = class_names[cls].lower()

        # Determine color scheme
        if class_name in positive_classes:
            color = (0, 200, 0)          # Green
            text_color = (255, 255, 255) # White text
        elif class_name in negative_classes:
            color = (0, 0, 255)          # Red
            text_color = (0, 255, 255)   # Yellow text
        else:
            color = (0, 255, 255)        # Yellow
            text_color = (0, 0, 0)       # Black text
        
        # Draw rectangle
        cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)

        # Draw text
        label = f"{class_names[cls]} {conf:.2f}"
        cv2.putText(
            frame, 
            label, 
            (x1, y1 - 10), 
            cv2.FONT_HERSHEY_SIMPLEX, 
            0.5, 
            text_color, 
            2
        )
        
    return frame
