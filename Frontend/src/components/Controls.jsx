import { Camera, Video } from "lucide-react";
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

  return (
    <div className="h-full px-6 flex items-center justify-center gap-4 border-t border-white/10">
      {!isStreaming ? (
        <button
          onClick={handleStart}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
        >
          <Camera className="w-5 h-5" /> Start Camera
        </button>
      ) : (
        <button
          onClick={handleStop}
          className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-colors"
        >
          <Video className="w-5 h-5" /> Stop Camera
        </button>
      )}
      
      <div className="ml-6 text-sm text-white/70">
        WS:
        <span className={`ml-1 font-semibold ${
          wsState === "open" ? "text-green-400" :
          wsState === "error" ? "text-red-400" :
          "text-yellow-400"
        }`}>
          {wsState}
        </span>
        <span className="mx-2">·</span>
        Camera:
        <span className={`ml-1 font-semibold ${isStreaming ? "text-green-400" : "text-gray-400"}`}>
          {isStreaming ? "Active" : "Inactive"}
        </span>
      </div>
    </div>
  );
}