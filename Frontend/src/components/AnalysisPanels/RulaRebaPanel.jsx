import { useCamera } from "../../hooks/useCamera";
import { useWebSocket } from "../../hooks/useWebSocket";
import { riskColor } from "../../utils/riskUtils";

export default function RulaRebaPanel() {
  const { lastResult, isAnyStreamActive } = useWebSocket();
  
  const posture = lastResult?.posture;

  const ScoreBar = ({ label, score, max, riskLevel }) => {
    const pct = ((score || 0) / max) * 100;
    const color = score <= max * 0.33
      ? "bg-green-500"
      : score <= max * 0.66
      ? "bg-yellow-500"
      : "bg-red-500";

    return (
      <div className="py-2.5 border-b border-zinc-700 last:border-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-zinc-300">{label}</span>
          <div className="flex items-center gap-2">
            {riskLevel && (
              <span className="text-[10px] text-zinc-400 capitalize">{riskLevel}</span>
            )}
            <span className="text-xs font-bold text-white tabular-nums">
              {score ?? "-"}<span className="text-zinc-500 font-normal">/{max}</span>
            </span>
          </div>
        </div>
        <div className="w-full bg-zinc-700 rounded-full h-1">
          <div
            className={`${color} h-1 rounded-full transition-all duration-500`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="w-[320px] lg:w-[350px] shrink-0 h-full bg-zinc-800 rounded-xl border border-zinc-700 overflow-hidden flex flex-col">

      {/* Header */}
      <div className="px-4 py-2.5 border-b border-zinc-700 bg-zinc-700/30 flex justify-between items-center shrink-0">
        <span className="text-xs font-semibold tracking-widest text-zinc-300 uppercase">
          Ergonomic Analysis
        </span>
        {!isAnyStreamActive && (
          <span className="text-[10px] text-red-400/70 tracking-wide">Stream inactive</span>
        )}
        {isAnyStreamActive && posture && (
          <span className="text-[10px] text-green-400 tracking-wide">Pose detected</span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {!isAnyStreamActive ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-xs text-zinc-400 text-center px-6">
              Ergonomic analysis will appear once the camera/stream is active
            </p>
          </div>
        ) : !posture ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center px-6 space-y-2">
              <p className="text-xs text-zinc-400">No posture detected</p>
              <div className="text-[10px] text-zinc-500 space-y-1">
                <p>Ensure person is fully visible</p>
                <p>Stand facing the camera</p>
                <p>Ensure good lighting</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="px-4 py-1">
            {posture.rula && (
              <ScoreBar
                label="RULA"
                score={posture.rula.score}
                max={7}
                riskLevel={posture.rula.risk_level}
              />
            )}
            {posture.reba && (
              <ScoreBar
                label="REBA"
                score={posture.reba.score}
                max={15}
                riskLevel={posture.reba.risk_level}
              />
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-zinc-700 flex items-center gap-1.5 shrink-0">
        <span className={`w-1.5 h-1.5 rounded-full ${isAnyStreamActive && posture ? "bg-green-500" : "bg-zinc-600"}`} />
        <span className="text-[10px] text-zinc-400">
          {isAnyStreamActive && posture ? "Analyzing posture" : "Awaiting pose data"}
        </span>
      </div>
    </div>
  );
}