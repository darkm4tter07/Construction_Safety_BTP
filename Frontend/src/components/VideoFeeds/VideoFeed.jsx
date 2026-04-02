import { useWebSocket } from "../../hooks/useWebSocket";

export default function VideoFeed({ title, channel }) {
  const { frames, fps } = useWebSocket();
  const frame = frames[channel];

  return (
    // Changed back to bg-zinc-800 to match the other panels
    <div className="w-full h-full bg-zinc-800 rounded-xl overflow-hidden flex flex-col border border-zinc-700">

      {/* Header */}
      <div className="px-4 py-2.5 border-b border-zinc-700 bg-zinc-700/30 flex items-center justify-between shrink-0">
        <span className="text-xs font-semibold tracking-widest text-zinc-300 uppercase">
          {title}
        </span>
        <div className="flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full ${frame ? "bg-green-500" : "bg-zinc-600"}`} />
          <span className="text-[10px] text-zinc-400 tabular-nums">
            FPS: {fps.toFixed(1)}
          </span>
        </div>
      </div>

      {/* Feed - Kept bg-transparent so it inherits the zinc-800 smoothly */}
      <div className="flex-1 min-h-0 flex items-center justify-center bg-transparent">
        {frame ? (
          <img
            src={frame}
            alt={`${title} feed`}
            className="w-full h-full object-contain select-none"
            draggable="false"
          />
        ) : (
          <div className="flex flex-col items-center gap-1.5 text-center">
            <div className="w-8 h-8 rounded-full border border-zinc-700 flex items-center justify-center mb-1">
              <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"
                />
              </svg>
            </div>
            <span className="text-xs text-zinc-400">No feed</span>
            <span className="text-[10px] text-zinc-500">
              Waiting for {channel} frames...
            </span>
          </div>
        )}
      </div>
    </div>
  );
}