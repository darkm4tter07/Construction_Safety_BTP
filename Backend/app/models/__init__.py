from .safety_monitor import SafetyMonitor

print("Starting SafetyMonitor initialization...")
try:
    safety_monitor = SafetyMonitor(yolo_model_path="yolo_models/yolo11n.pt")
    print("SafetyMonitor initialized successfully!")
except Exception as e:
    print(f"ERROR initializing SafetyMonitor: {e}")
    import traceback
    traceback.print_exc()
    raise