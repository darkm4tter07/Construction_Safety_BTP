import { useCamera } from "../../hooks/useCamera";
import { useWebSocket } from "../../hooks/useWebSocket";
import { riskColor } from "../../utils/riskUtils";

export default function RulaRebaPanel() {
  const { lastResult } = useWebSocket();
  const { isStreaming } = useCamera();
  const posture = lastResult?.posture;

  if (!isStreaming) {
    return (
      <div className="w-full h-full bg-gray-800 rounded-xl shadow-xl overflow-hidden flex flex-col">
        <div className="px-4 py-2 border-b border-white/10 font-semibold flex items-center justify-between">
          <span>Ergonomic Analysis</span>
          <span className="text-red-500">Camera Not Active</span>
        </div>
        <div className="p-3 flex-1 overflow-auto text-neutral-500 text-sm">
          Here you will see ergonomic analysis once the camera is active.
        </div>
      </div>
    );
  }

  const Block = ({ label, score, max, riskLevel }) => (
    <div className="bg-gray-700/70 rounded-md p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium">{label}</span>
        <span className={`px-2 py-0.5 rounded text-xs ${riskColor(score, max).bg}`}>
          {score ?? "-"}
        </span>
      </div>
      <div className="w-full bg-gray-600 rounded h-1 mb-2">
        <div 
          className={`${riskColor(score, max).bg} h-1 rounded`} 
          style={{ width: `${((score || 0) / max) * 100}%` }} 
        />
      </div>
      {riskLevel && (
        <div className="text-xs text-white/60">{riskLevel}</div>
      )}
    </div>
  );

  return (
    <div className="w-full h-full bg-gray-800 rounded-xl shadow-xl overflow-hidden">
      <div className="px-4 py-2 border-b border-white/10 font-semibold">
        Ergonomic Analysis
      </div>
      <div className="p-3 h-[calc(100%-40px)] overflow-auto">
        {posture ? (
          <div className="space-y-3">
            {posture.rula && (
              <Block 
                label="RULA" 
                score={posture.rula.score} 
                max={7} 
                riskLevel={posture.rula.risk_level}
              />
            )}
            {posture.reba && (
              <Block 
                label="REBA" 
                score={posture.reba.score} 
                max={15} 
                riskLevel={posture.reba.risk_level}
              />
            )}
          </div>
        ) : (
          <div className="text-white/40 text-sm">
            <div className="mb-2">No posture detected</div>
            <div className="text-xs text-white/30">
              • Ensure person is fully visible in frame
              <br />
              • Stand facing the camera
              <br />
              • Ensure good lighting
            </div>
          </div>
        )}
      </div>
    </div>
  );
}