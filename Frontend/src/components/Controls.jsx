import { useState } from "react";
import { Camera, Video, Download, Loader2, Tv2, TvMinimalPlay } from "lucide-react";
import { useCamera } from "../hooks/useCamera";
import { useWebSocket } from "../hooks/useWebSocket";
import { wsStore } from "../store/wsStore";
import { exportDashboardPDF } from "../utils/exportPDF";
import axios from "axios";
import { AUTH_URL as API_URL } from "../Constant";
import { getDetectionCounts } from "../utils/detectionUtils";

export default function Controls() {
  const { wsState, clearFrames } = useWebSocket();
  const { startCamera, stopCamera, isStreaming } = useCamera();
  const [exporting, setExporting] = useState(false);
  const [cctvStreaming, setCctvStreaming] = useState(false);

  const handleStart = async () => {
    try {
      await startCamera();
      wsStore.setStreamSource("webcam"); 
    } catch (error) {
      console.error("Failed to start camera:", error);
      alert("Failed to access camera. Please check permissions.");
    }
  };

  const handleStop = () => {
    stopCamera();
    wsStore.setStreamSource(null); 
    setTimeout(() => wsStore.clearFrames(), 300);
  };

  const handleStartCCTV = () => {
    const sent = wsStore.send({
      type: "start_cctv",
      path: "app/uploads/test.mp4", // change this to your video file path
    });
    if (sent) {
      setCctvStreaming(true);
      wsStore.setStreamSource("cctv"); // add
    }else{
      alert("WebSocket not connected. Start the FastAPI server first.");
    }
  };

  const handleStopCCTV = () => {
    wsStore.send({ type: "stop_cctv" });
    setCctvStreaming(false);
    wsStore.setStreamSource(null);
    setTimeout(() => wsStore.clearFrames(), 300);
  };

  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const response = await axios.get(`${API_URL}/fitness/connected-workers`);
      const workers = response.data.workers || [];
      const weather = window.__weatherData || null;
      const alerts = window.__alertsData || [];
      const detections = wsStore.lastResult?.detections ?? [];
      const counts = getDetectionCounts(detections);
      const compliance = counts.personCount > 0
        ? Math.round(((counts.hardhatCount + counts.maskCount + counts.vestCount) / (counts.personCount * 3)) * 100)
        : null;
      const ppeData = { ...counts, compliance };
      exportDashboardPDF({ workers, weather, alerts, ppeData });
    } catch (err) {
      console.error('Export failed:', err);
      alert('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
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

        <span className="text-zinc-700">·</span>

        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${cctvStreaming ? "bg-purple-500" : "bg-zinc-600"}`} />
          <span className="text-[11px] text-zinc-400">
            CCTV: <span className={`font-medium ${cctvStreaming ? "text-purple-400" : "text-zinc-500"}`}>
              {cctvStreaming ? "Active" : "Inactive"}
            </span>
          </span>
        </div>
      </div>

      {/* Center: Camera + CCTV buttons */}
      <div className="flex items-center gap-3">
        {/* Webcam buttons */}
        {!isStreaming ? (
          <button
            onClick={handleStart}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-semibold text-white transition-colors"
          >
            <Camera className="w-4 h-4" />
            Start Camera
          </button>
        ) : (
          <button
            onClick={handleStop}
            className="flex items-center gap-2 px-5 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-sm font-semibold text-white transition-colors"
          >
            <Video className="w-4 h-4" />
            Stop Camera
          </button>
        )}

        {/* Divider */}
        <span className="text-zinc-700">|</span>

        {/* CCTV buttons */}
        {!cctvStreaming ? (
          <button
            onClick={handleStartCCTV}
            disabled={wsState !== "open"}
            className="flex items-center gap-2 px-5 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Tv2 className="w-4 h-4" />
            Start CCTV
          </button>
        ) : (
          <button
            onClick={handleStopCCTV}
            className="flex items-center gap-2 px-5 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-sm font-semibold text-white transition-colors"
          >
            <TvMinimalPlay className="w-4 h-4" />
            Stop CCTV
          </button>
        )}
      </div>

      {/* Right: Export button */}
      <button
        onClick={handleExport}
        disabled={exporting}
        className="flex items-center gap-2 px-4 py-2 bg-zinc-200 text-zinc-900 text-sm font-medium rounded hover:bg-white transition focus:outline-none focus:ring-0 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {exporting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        {exporting ? 'Exporting...' : 'Export Data'}
      </button>

    </div>
  );
}