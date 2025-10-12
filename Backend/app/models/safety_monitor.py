import cv2
from .yolo_detector import YOLODetector
from .pose_detector import PoseDetector
from .ergonomic_analyzer import ErgonomicAnalyzer
from app.utils.drawing_utils import draw_detections
from app.utils.fps_counter import FPSCounter

class SafetyMonitor:
    def __init__(self, yolo_model_path):
        self.yolo = YOLODetector(yolo_model_path)
        self.pose_detector = PoseDetector()
        self.ergonomic = ErgonomicAnalyzer()
        self.fps_counter = FPSCounter()

    def process_frame(self, frame):

        ''' Process a single video frame for PPE detection and ergonomic analysis. '''

        # Resize frame for faster processing
        frame_resized = cv2.resize(frame, (640, 480))

        # PPE Detection
        detections = self.yolo.detect(frame_resized) # Yolo Detection
        frame_resized = draw_detections(frame_resized, detections, self.yolo.model.names)

        # Pose Detection
        pose_landmarks, landmarks = self.pose_detector.detect(frame_resized)

        # Ergonomic Analysis
        posture_results = self.ergonomic.analyze_posture(landmarks) if landmarks else None

        # FPS
        fps = self.fps_counter.update()
        cv2.putText(frame_resized, f"FPS: {fps}", (10, frame_resized.shape[0]-10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255,255,255), 2)

        return frame_resized, {"detections": detections, "posture": posture_results, "fps": fps}
    
    def process_video_stream(self, video_path):
        '''Process video file frame by frame'''
        cap = cv2.VideoCapture(video_path)
        
        if not cap.isOpened():
            print(f"Error: Cannot open video {video_path}")
            return
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            
            processed_frame, results = self.process_frame(frame)
            yield processed_frame, results
            
        cap.release()

    def cleanup(self):
        self.pose_detector.cleanup()
