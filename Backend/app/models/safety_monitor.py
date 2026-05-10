import cv2
import traceback
import time
from .yolo_detector import YOLODetector
from .pose_detector import PoseDetector
from .ergonomic_analyzer import ErgonomicAnalyzer
from app.utils.drawing_utils import draw_detections
from app.utils.fps_counter import FPSCounter
from app.services.worker_tracking_service import worker_tracking_service

class SafetyMonitor:
    def __init__(self, yolo_model_path):
        print("🔧 Initializing SafetyMonitor components...")
        self.yolo = YOLODetector(yolo_model_path)
        print("✅ YOLO initialized")
        
        self.pose_detector = PoseDetector()
        print("✅ PoseDetector initialized")
        
        self.ergonomic = ErgonomicAnalyzer()
        print("✅ ErgonomicAnalyzer initialized")
        
        self.fps_counter = FPSCounter()
        print("✅ FPSCounter initialized")

    def process_frame(self, frame):
        """Process frame and return two separate outputs:
        - object_frame: YOLO bounding boxes
        - pose_frame: Mediapipe skeleton overlay
        """
        # Resize for performance
        frame_resized = cv2.resize(frame, (640, 480))
        t1 = time.time()
        # ---------------------
        # 1. YOLO OBJECT FRAME
        # ---------------------
        detections = self.yolo.detect(frame_resized.copy())
        print(f"YOLO: {(time.time()-t1)*1000:.1f}ms")

        # ---------------------
        # 2. TRACKING UPDATE
        # ---------------------
        tracking_result = worker_tracking_service.update_tracks(detections)

        object_frame = draw_detections(
            frame_resized.copy(),
            detections,
            self.yolo.model.names,
            track_mappings=tracking_result["active_tracks"]
        )
        t2 = time.time()

        # ---------------------
        # 3. POSE FRAME
        # ---------------------
        try:
            # Create a fresh copy for pose detection
            pose_input = frame_resized.copy()
            pose_landmarks, landmarks = self.pose_detector.detect(pose_input)
            print(f"MediaPipe: {(time.time()-t2)*1000:.1f}ms")
            # Start with original frame copy
            pose_frame = frame_resized.copy()
            
            if pose_landmarks:
                # Draw landmarks on pose_frame
                self.pose_detector.mp_drawing.draw_landmarks(
                    pose_frame,
                    pose_landmarks,
                    self.pose_detector.mp_pose.POSE_CONNECTIONS,
                    self.pose_detector.mp_drawing.DrawingSpec(color=(0, 255, 0), thickness=2, circle_radius=2),
                    self.pose_detector.mp_drawing.DrawingSpec(color=(255, 0, 0), thickness=2, circle_radius=2)
                )
                
                # Add text overlay to confirm pose detection
                cv2.putText(
                    pose_frame, 
                    "POSE DETECTED", 
                    (10, 30), 
                    cv2.FONT_HERSHEY_SIMPLEX, 
                    0.7, 
                    (0, 255, 0), 
                    2
                )
            else:
                # Add text to show pose detection is running but found nothing
                cv2.putText(
                    pose_frame, 
                    "NO POSE DETECTED", 
                    (10, 30), 
                    cv2.FONT_HERSHEY_SIMPLEX, 
                    0.7, 
                    (0, 0, 255), 
                    2
                )
        except Exception as e:
            print(f"❌ Error in pose detection: {e}")
            import traceback
            traceback.print_exc()
            pose_frame = frame_resized.copy()
            landmarks = []
            cv2.putText(
                pose_frame, 
                f"POSE ERROR: {str(e)[:30]}", 
                (10, 30), 
                cv2.FONT_HERSHEY_SIMPLEX, 
                0.5, 
                (0, 0, 255), 
                2
            )

        # ---------------------
        # 4. ERGONOMIC ANALYSIS
        # ---------------------
        posture_results = None
        t3 = time.time()
        if landmarks:
            try:
                posture_results = self.ergonomic.analyze_posture(landmarks)
                print(f"Ergonomic Analysis: {(time.time()-t3)*1000:.1f}ms")
            except Exception as e:
                print(f"⚠️ Error in ergonomic analysis: {e}")

        # ---------------------
        # 5. FPS
        # ---------------------
        fps = self.fps_counter.update()

        print(f"Total Frame Processing Time: {(time.time()-t1)*1000:.1f}ms | FPS: {fps:.1f}")

        return {
            "object_frame": object_frame,
            "pose_frame": pose_frame,
            "detections": detections,
            "posture": posture_results,
            "fps": fps,
            "tracking": tracking_result
        }

    def process_video_stream(self, video_path):
        """Process video file frame by frame"""
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            print(f"Error: Cannot open video {video_path}")
            return

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            result = self.process_frame(frame)
            yield result["object_frame"], result

        cap.release()

    def cleanup(self):
        print("🧹 Cleaning up SafetyMonitor...")
        self.pose_detector.cleanup()
        worker_tracking_service.reset()