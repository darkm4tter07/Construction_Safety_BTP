import { Camera, Video, Download } from "lucide-react";
import { useCamera } from "../hooks/useCamera";
import { useWebSocket } from "../hooks/useWebSocket";

export default function Controls() {
  const { wsState, clearFrames } = useWebSocket();
  const { startCamera, stopCamera, isStreaming } = useCamera();

  const handleStart = async () => {
    try {
      await startCamera();
    } catch (error) {
      console.error("Failed to start camera:", error);
      alert("Failed to access camera. Please check permissions.");
    }
  };

  const handleStop = () => {
    stopCamera();
    clearFrames();
  };

  const handleExport = () => {
    // TODO: Implement dashboard data export
    console.log("Export triggered");
  };

  return (
    <div className="h-full px-6 flex items-center justify-between border-t border-zinc-800 bg-zinc-900">

      {/* Left: Status indicators */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${
            wsState === "open" ? "bg-green-500" :
            wsState === "error" ? "bg-red-500" :
            "bg-yellow-500"
          }`} />
          <span className="text-[11px] text-zinc-400">
            WS: <span className={`font-medium ${
              wsState === "open" ? "text-green-400" :
              wsState === "error" ? "text-red-400" :
              "text-yellow-400"
            }`}>{wsState}</span>
          </span>
        </div>

        <span className="text-zinc-700">·</span>

        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${isStreaming ? "bg-green-500" : "bg-zinc-600"}`} />
          <span className="text-[11px] text-zinc-400">
            Camera: <span className={`font-medium ${isStreaming ? "text-green-400" : "text-zinc-500"}`}>
              {isStreaming ? "Active" : "Inactive"}
            </span>
          </span>
        </div>
      </div>

      {/* Center: Camera button */}
      <div>
        {!isStreaming ? (
          <button
            onClick={handleStart}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-semibold text-white transition-colors"
          >
            <Camera className="w-4 h-4" />
            Start Camera
          </button>
        ) : (
          <button
            onClick={handleStop}
            className="flex items-center gap-2 px-6 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-sm font-semibold text-white transition-colors"
          >
            <Video className="w-4 h-4" />
            Stop Camera
          </button>
        )}
      </div>

      {/* Right: Export button */}
      <button
        onClick={handleExport}
        className="
          flex items-center gap-2
          px-4 py-2
          bg-zinc-200 text-zinc-900
          text-sm font-medium
          rounded
          hover:bg-white
          transition
          focus:outline-none focus:ring-0
        "
      >
        <Download className="w-4 h-4" />
        Export Data
      </button>

    </div>
  );
}