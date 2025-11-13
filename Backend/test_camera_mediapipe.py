"""
Test MediaPipe with your actual camera
This is the most reliable test since it uses real images

Usage: python test_camera_mediapipe.py
Press 'q' to quit
"""

import cv2
import mediapipe as mp
import sys

def fprint(text):
    print(text, flush=True)
    sys.stdout.flush()

def test_with_camera():
    fprint("=" * 60)
    fprint("   MEDIAPIPE CAMERA TEST")
    fprint("=" * 60)
    
    # Initialize MediaPipe
    fprint("\n[1/3] Initializing MediaPipe...")
    try:
        mp_pose = mp.solutions.pose
        pose = mp_pose.Pose(
            static_image_mode=False,
            model_complexity=1,
            smooth_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        mp_drawing = mp.solutions.drawing_utils
        fprint("    ✅ MediaPipe initialized")
    except Exception as e:
        fprint(f"    ❌ Failed: {e}")
        return False
    
    # Open camera
    fprint("\n[2/3] Opening camera...")
    cap = cv2.VideoCapture(0)
    
    if not cap.isOpened():
        fprint("    ❌ Cannot open camera")
        fprint("    Make sure your camera is connected and not in use")
        return False
    
    fprint("    ✅ Camera opened")
    fprint("\n[3/3] Processing camera feed...")
    fprint("    📹 A window should open showing your camera")
    fprint("    👤 Stand in front of the camera")
    fprint("    🟢 Green skeleton = MediaPipe working!")
    fprint("    ⌨️  Press 'q' to quit")
    fprint("\n" + "=" * 60)
    
    frame_count = 0
    detected_count = 0
    
    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                fprint("❌ Failed to read frame")
                break
            
            frame_count += 1
            
            # Resize for performance
            frame = cv2.resize(frame, (640, 480))
            
            # Process with MediaPipe
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = pose.process(rgb)
            
            # Draw landmarks if detected
            if results.pose_landmarks:
                detected_count += 1
                mp_drawing.draw_landmarks(
                    frame,
                    results.pose_landmarks,
                    mp_pose.POSE_CONNECTIONS,
                    mp_drawing.DrawingSpec(color=(0, 255, 0), thickness=2, circle_radius=2),
                    mp_drawing.DrawingSpec(color=(255, 0, 0), thickness=2, circle_radius=2)
                )
                
                # Add status text
                cv2.putText(
                    frame,
                    "POSE DETECTED - MediaPipe Working!",
                    (10, 30),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.7,
                    (0, 255, 0),
                    2
                )
            else:
                # No pose detected
                cv2.putText(
                    frame,
                    "No pose detected - Stand in view",
                    (10, 30),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.7,
                    (0, 0, 255),
                    2
                )
            
            # Add frame counter
            cv2.putText(
                frame,
                f"Frame: {frame_count} | Detected: {detected_count}",
                (10, 460),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.5,
                (255, 255, 255),
                1
            )
            
            # Display
            cv2.imshow('MediaPipe Camera Test - Press Q to quit', frame)
            
            # Check for 'q' key
            if cv2.waitKey(1) & 0xFF == ord('q'):
                fprint("\n✅ Test stopped by user")
                break
                
    except KeyboardInterrupt:
        fprint("\n⚠️ Interrupted by user")
    except Exception as e:
        fprint(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        cap.release()
        cv2.destroyAllWindows()
        pose.close()
    
    # Results
    fprint("\n" + "=" * 60)
    fprint("TEST RESULTS:")
    fprint(f"  Total frames: {frame_count}")
    fprint(f"  Poses detected: {detected_count}")
    
    if detected_count > 0:
        fprint(f"  Detection rate: {(detected_count/frame_count)*100:.1f}%")
        fprint("\n✅ MediaPipe is working correctly with your camera!")
        fprint("   Your application should work fine.")
        return True
    else:
        fprint("\n⚠️ No poses detected")
        fprint("   MediaPipe initialized but didn't detect you")
        fprint("   Try:")
        fprint("   1. Make sure you're visible in the camera")
        fprint("   2. Ensure good lighting")
        fprint("   3. Stand at arm's length from camera")
        return False

if __name__ == "__main__":
    success = test_with_camera()
    sys.exit(0 if success else 1)