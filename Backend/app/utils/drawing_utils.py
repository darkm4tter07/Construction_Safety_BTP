import cv2

def draw_detections(frame, detections, class_names, track_mappings=None):

    # Class Groups
    positive_classes = ["hardhat", "helmet", "mask", "safety vest", "vest"]
    negative_classes = ["no-hardhat", "no-mask", "no-safety vest", "no-vest"]
    person_classes = ["person"]
    
    for det in detections:
        x1, y1, x2, y2 = map(int, det["bbox"])
        cls = det["class_id"]
        conf = det.get("conf", 0)
        track_id = det.get("track_id", None)
        
        class_name = class_names[cls].lower()

        # Determine color scheme
        if class_name in positive_classes:
            color = (0, 200, 0)          # Green
            text_color = (255, 255, 255) # White text
        elif class_name in negative_classes:
            color = (0, 0, 255)          # Red
            text_color = (0, 255, 255)   # Yellow text
        elif class_name in person_classes:
            color = (255, 165, 0)        # Orange for unidentified person
            text_color = (255, 255, 255) # White text
        else:
            color = (0, 255, 255)        # Yellow
            text_color = (0, 0, 0)       # Black text
        
        # Draw rectangle
        cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)

        # Build label
        if class_name in person_classes and track_id is not None:
            if track_mappings and track_id in track_mappings:
                worker = track_mappings[track_id].get("worker")
                if worker:
                    role = worker["role"]
                    if role == "not_worker":
                        label = f"Not Worker #{track_id}"
                        color = (128, 128, 128)  # Grey for not_worker
                    elif role == "supervisor":
                        label = f"Supervisor: {worker['name']}"
                        color = (255, 0, 255)    # Purple for supervisor
                    else:
                        label = f"{worker['name']} {conf:.2f}"
                        color = (0, 200, 0)      # Green once identified
                    # Redraw rectangle with updated color
                    cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
                else:
                    label = f"Person #{track_id} {conf:.2f}"
            else:
                label = f"Person #{track_id} {conf:.2f}"
        else:
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