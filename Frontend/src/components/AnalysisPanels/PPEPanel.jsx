import { useCamera } from "../../hooks/useCamera";
import { useWebSocket } from "../../hooks/useWebSocket";
import { Users } from "lucide-react";
import { getDetectionCounts, CLASS_IDS } from "../../utils/detectionUtils";

export default function PPEPanel() {
  const { lastResult, isAnyStreamActive } = useWebSocket();

  const detections = lastResult?.detections ?? [];
  const counts = getDetectionCounts(detections);

  const OTHER_CLASSES = {
    [CLASS_IDS.SAFETY_CONE]: "Safety Cone",
    [CLASS_IDS.MACHINERY]: "Machinery",
    [CLASS_IDS.UTILITY_POLE]: "Utility Pole",
    [CLASS_IDS.VEHICLE]: "Vehicle",
  };

  const otherDetections = Object.entries(OTHER_CLASSES)
    .map(([id, name]) => {
      const count = detections.filter(d => d.class_id === Number(id)).length;
      return count > 0 ? { name, count } : null;
    })
    .filter(Boolean);

  const compliance = counts.personCount > 0
    ? Math.round(((counts.hardhatCount + counts.maskCount + counts.vestCount) / (counts.personCount * 3)) * 100)
    : 0;

  const StatusRow = ({ label, count, expected }) => {
    const ok = count >= expected && expected > 0;
    const missing = Math.max(0, expected - count);
    return (
      <div className="flex items-center justify-between py-2.5 border-b border-zinc-700 last:border-0 group">
        <span className="text-xs text-zinc-300 group-hover:text-white transition-colors">
          {label}
        </span>
        <div className="flex items-center gap-2">
          {!ok && missing > 0 && (
            <span className="text-[10px] text-red-400/70">
              -{missing}
            </span>
          )}
          <span className={`text-xs font-semibold tabular-nums ${ok ? "text-green-400" : "text-red-400"}`}>
            {count}/{expected}
          </span>
          <span className={`w-1.5 h-1.5 rounded-full ${ok ? "bg-green-500" : "bg-red-500"}`} />
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full bg-zinc-800 rounded-xl border border-zinc-700 overflow-hidden flex flex-col">

      {/* Header */}
      <div className="px-4 py-2.5 border-b border-zinc-700 bg-zinc-700/30 flex justify-between items-center">
        <span className="text-xs font-semibold tracking-widest text-zinc-300 uppercase">
          PPE Compliance
        </span>
        {!isAnyStreamActive && (
          <span className="text-[10px] text-red-400/70 tracking-wide">
            Stream Inactive
          </span>
        )}
        {isAnyStreamActive && counts.personCount > 0 && (
          <span className={`text-[10px] font-semibold tracking-wide ${
            compliance === 100 ? "text-green-400" : compliance >= 60 ? "text-yellow-400" : "text-red-400"
          }`}>
            {compliance}% compliant
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {!isAnyStreamActive ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-xs text-zinc-400 text-center px-6">
              PPE status will appear once the camera/stream is active
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-3">

            {/* Person Count */}
            <div className="flex items-center justify-between py-2 border-b border-zinc-700">
              <div className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-xs text-zinc-300">persons detected</span>
              </div>
              <span className="text-xs font-bold text-white tabular-nums">
                {counts.personCount}
              </span>
            </div>

            {/* PPE Rows */}
            <div>
              <StatusRow label="Hardhats" count={counts.hardhatCount} expected={counts.personCount} />
              <StatusRow label="Masks" count={counts.maskCount} expected={counts.personCount} />
              <StatusRow label="Safety Vests" count={counts.vestCount} expected={counts.personCount} />
            </div>

            {/* Other Detections */}
            {otherDetections.length > 0 && (
              <div className="pt-1">
                <span className="text-[10px] text-zinc-400 uppercase tracking-widest">
                  Other
                </span>
                <div className="mt-2 space-y-0">
                  {otherDetections.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center py-2 border-b border-zinc-700 last:border-0"
                    >
                      <span className="text-xs text-zinc-400">{item.name}</span>
                      <span className="text-xs font-medium text-zinc-300 tabular-nums">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-zinc-700 flex items-center gap-1.5">
        <span className={`w-1.5 h-1.5 rounded-full ${isAnyStreamActive ? "bg-green-500" : "bg-zinc-600"}`} />
        <span className="text-[10px] text-zinc-400">
          {isAnyStreamActive ? `${detections.length} objects in frame` : "Stream Inactive"}
        </span>
      </div>
    </div>
  );
}