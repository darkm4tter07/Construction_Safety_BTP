import { useCamera } from "../../hooks/useCamera";
import { useWebSocket } from "../../hooks/useWebSocket";
import { Shield, AlertTriangle } from "lucide-react";

// Define expected PPE items based on YOLO class IDs
// Your model detects both positive (wearing PPE) and negative (not wearing PPE) classes
const EXPECTED_PPE = {
  0: { name: "Hardhat", required: true, type: "positive" },
  1: { name: "Mask", required: true, type: "positive" },
  7: { name: "Safety Vest", required: true, type: "positive" },
  // Negative detections (NO-PPE) - these indicate violations
  2: { name: "NO-Hardhat", required: false, type: "negative", violationType: "Missing Hardhat" },
  3: { name: "NO-Mask", required: false, type: "negative", violationType: "Missing Mask" },
  4: { name: "NO-Safety Vest", required: false, type: "negative", violationType: "Missing Safety Vest" },
  // Other detections (informational)
  5: { name: "Person", required: false, type: "info" },
  6: { name: "Safety Cone", required: false, type: "info" },
  8: { name: "Machinery", required: false, type: "info" },
  9: { name: "Utility Pole", required: false, type: "info" },
  10: { name: "Vehicle", required: false, type: "info" },
};

export default function PPEPanel() {
  const {lastResult } = useWebSocket();
  const {isStreaming} = useCamera()
  const detections = lastResult?.detections ?? [];
  // Create a map of detected class IDs
  const detectedClassIds = new Set(detections.map(d => d.class_id));

  // Filter only PPE-related items (positive detections and negative detections)
  const ppeItems = Object.entries(EXPECTED_PPE).filter(([_, info]) => 
    info.type === "positive" || info.type === "negative"
  );

  // Build status for each PPE item
  const ppeStatus = ppeItems.map(([classId, info]) => {
    const id = parseInt(classId);
    const detection = detections.find(d => d.class_id === id);
    
    // For positive PPE items
    if (info.type === "positive") {
      return {
        classId: id,
        name: info.name,
        required: info.required,
        detected: detectedClassIds.has(id),
        detection: detection,
        isViolation: false,
      };
    } 
    // For negative items (NO-PPE detections)
    else {
      return {
        classId: id,
        name: info.violationType || info.name,
        required: true, // Treat as required since it's a violation
        detected: !detectedClassIds.has(id), // Inverted logic: good if NOT detected
        detection: detection,
        isViolation: detectedClassIds.has(id), // It's a violation if detected
      };
    }
  });

  const detectedCount = ppeStatus.filter(p => p.detected && p.required).length;
  const requiredCount = ppeStatus.filter(p => p.required).length;
  const violationCount = ppeStatus.filter(p => p.isViolation).length;
  if(!isStreaming) {
    return(
      <div className="w-full h-full bg-gray-800 rounded-xl shadow-xl overflow-hidden flex flex-col">
        <div className="px-4 py-2 border-b border-white/10 font-semibold flex items-center justify-between">
          <span>PPE Detection</span>
          <span className="text-red-500">
            Camera Not Active
          </span>
        </div>
        <div className="p-3 flex-1 overflow-auto text-neutral-500 text-sm">
            Here you will see PPE detection status once the camera is active.
          </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full bg-gray-800 rounded-xl shadow-xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-4 py-2 border-b border-white/10 font-semibold flex items-center justify-between">
        <span>PPE Detection</span>
        
        <div className="flex gap-2">
          {violationCount > 0 && (
            <span className="text-xs px-2 py-1 rounded bg-red-600 animate-pulse">
              ⚠️ {violationCount} Violation{violationCount > 1 ? 's' : ''}
            </span>
          )}
          <span className={`text-xs px-2 py-1 rounded ${detectedCount === requiredCount && violationCount === 0 ? 'bg-green-600' : 'bg-red-600'}`}>
            {detectedCount}/{requiredCount}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 flex-1 overflow-auto">
        {ppeStatus.length === 0 ? (
          <div className="text-white/40 text-sm">No PPE configured</div>
        ) : (
          <div className="space-y-2">
            {ppeStatus.map((item) => (
              <div
                key={item.classId}
                className={`rounded-md p-3 border ${
                  item.isViolation
                    ? 'bg-red-900/40 border-red-500/50 animate-pulse'
                    : item.detected
                    ? 'bg-green-900/30 border-green-500/30'
                    : item.required
                    ? 'bg-red-900/30 border-red-500/30'
                    : 'bg-gray-700/50 border-gray-600/30'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {item.isViolation ? (
                      <AlertTriangle className="w-4 h-4 text-red-400 animate-pulse" />
                    ) : item.detected ? (
                      <Shield className="w-4 h-4 text-green-400" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                    )}
                    <span className="font-medium text-sm">{item.name}</span>
                    {item.required && !item.isViolation && (
                      <span className="text-xs text-white/50">(Required)</span>
                    )}
                  </div>
                  
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      item.isViolation 
                        ? 'bg-red-600 text-white'
                        : item.detected 
                        ? 'bg-green-600' 
                        : 'bg-red-600'
                    }`}
                  >
                    {item.isViolation ? '⚠️ VIOLATION' : item.detected ? 'DETECTED' : 'MISSING'}
                  </span>
                </div>

                {/* Confidence bar (only if detection exists) */}
                {item.detection && (
                  <>
                    <div className="flex justify-between text-xs text-white/60 mb-1">
                      <span>Confidence</span>
                      <span>{(item.detection.conf * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-600 rounded h-1.5">
                      <div
                        className={`h-1.5 rounded ${
                          item.isViolation 
                            ? 'bg-red-500'
                            : item.detection.conf > 0.7 
                            ? 'bg-green-500' 
                            : 'bg-yellow-500'
                        }`}
                        style={{ width: `${item.detection.conf * 100}%` }}
                      />
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}