import { useWebSocket } from "../../hooks/useWebSocket";

export default function VideoFeed({ title, channel }) {
  const { frames, fps } = useWebSocket();
  const frame = frames[channel];

  return (
    <div className="w-full h-full bg-gray-800 rounded-xl overflow-hidden shadow-xl flex flex-col">
      <div className="px-4 py-2 text-sm border-b border-white/10 flex items-center justify-between">
        <span className="font-semibold">{title}</span>
        <span className="text-white/50">FPS: {fps.toFixed(1)}</span>
      </div>
      <div className="flex-1 min-h-0 flex items-center justify-center bg-black">
        {frame ? (
          <img
            src={frame}
            alt={`${title} feed`}
            className="max-w-full max-h-full object-contain select-none"
            draggable="false"
          />
        ) : (
          <div className="text-white/40 text-sm">
            No feed
            <div className="text-xs mt-1 text-white/20">
              Waiting for {channel} frames...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}