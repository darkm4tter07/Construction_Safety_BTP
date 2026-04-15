import { useState, useEffect, useRef } from "react";
import { Camera, Video, Download, Loader2, Tv2, TvMinimalPlay, UserCheck } from "lucide-react";
import { useCamera } from "../hooks/useCamera";
import { useWebSocket } from "../hooks/useWebSocket";
import { wsStore } from "../store/wsStore";
import { exportDashboardPDF } from "../utils/exportPDF";
import axios from "axios";
import { AUTH_URL as API_URL } from "../Constant";
import { getDetectionCounts } from "../utils/detectionUtils";
import CCTVDialog from "./CCTVDialog";
import WorkerAssignmentModal from "./WorkerTracking/WorkerAssignmentModal";
import toast from "react-hot-toast";

export default function Controls() {
  const { wsState, lastResult, lastError, activeTracks, newUntracked, lostWorkers } = useWebSocket();
  const { startCamera, stopCamera, isStreaming } = useCamera();
  const [exporting, setExporting] = useState(false);
  const [cctvStreaming, setCctvStreaming] = useState(false);
  const [showCCTVDialog, setShowCCTVDialog] = useState(false);
  const [cctvError, setCctvError] = useState("");
  const [showAssignModal, setShowAssignModal] = useState(false);
  const prevUntrackedRef = useRef(new Set());
  const streamJustStartedRef = useRef(false);

  // ------------------------------------------------------------------
  // Stream error handler
  // ------------------------------------------------------------------
  useEffect(() => {
    if (lastError && cctvStreaming) {
      setCctvStreaming(false);
      wsStore.setStreamSource(null);
      toast.error(`Stream error: ${lastError}`);
      wsStore.clearFrames();
    }
  }, [lastError]);

  // ------------------------------------------------------------------
  // Toast notifications for tracking events
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!newUntracked || newUntracked.length === 0) return;
    if (streamJustStartedRef.current) return;

    const trulyNew = newUntracked.filter(id => !prevUntrackedRef.current.has(id));
    trulyNew.forEach(id => prevUntrackedRef.current.add(id));

    if (trulyNew.length > 0) {
      toast(
        `${trulyNew.length} unidentified person${trulyNew.length > 1 ? "s" : ""} in frame`,
        {
          icon: "⚠️",
          style: { background: "#27272a", color: "#fff", border: "1px solid #f97316" },
          duration: 4000,
        }
      );
    }
  }, [newUntracked]);

  useEffect(() => {
    if (!lostWorkers || lostWorkers.length === 0) return;
    if (streamJustStartedRef.current) return;

    lostWorkers.forEach((lw) => {
      toast(
        `${lw.worker?.name || "Person #" + lw.track_id} left the frame`,
        {
          icon: "🚶",
          style: { background: "#27272a", color: "#fff", border: "1px solid #3f3f46" },
          duration: 5000,
        }
      );
    });
  }, [lostWorkers]);

  // ------------------------------------------------------------------
  // Derive whether assign button should show
  // ------------------------------------------------------------------
  const isStreamActive = isStreaming || cctvStreaming;
  const hasPersonsInFrame = activeTracks && Object.keys(activeTracks).length > 0;
  const untrackedCount = newUntracked?.length ?? 0;
  const showAssignButton = wsState === "open" && isStreamActive && hasPersonsInFrame;

  // ------------------------------------------------------------------
  // Handlers
  // ------------------------------------------------------------------
  const handleStart = async () => {
    try {
      prevUntrackedRef.current = new Set();
      streamJustStartedRef.current = true;
      setTimeout(() => { streamJustStartedRef.current = false; }, 3000);
      await startCamera();
      wsStore.setStreamSource("webcam");
    } catch (error) {
      console.error("Failed to start camera:", error);
      toast.error("Failed to access camera. Please check permissions.");
    }
  };

  const handleStop = () => {
    wsStore.send({ type: "reset_tracking" });
    stopCamera();
    wsStore.setStreamSource(null);
    prevUntrackedRef.current = new Set();
    streamJustStartedRef.current = false;
    setTimeout(() => wsStore.clearFrames(), 300);
  };

  const handleStartCCTV = (path) => {
    const sent = wsStore.send({ type: "start_cctv", path });
    if (sent) {
      prevUntrackedRef.current = new Set();
      streamJustStartedRef.current = true;
      setTimeout(() => { streamJustStartedRef.current = false; }, 3000);
      setCctvStreaming(true);
      wsStore.setStreamSource("cctv");
      setCctvError("");

      const unsub = wsStore.subscribe((snap) => {
        if (snap.cctvStatus === "stopped" || wsStore._lastError) {
          setCctvStreaming(false);
          wsStore.setStreamSource(null);
          unsub();
        }
      });
    } else {
      toast.error("WebSocket not connected. Start the FastAPI server first.");
    }
  };

  const handleStopCCTV = () => {
    wsStore.send({ type: "reset_tracking" });
    wsStore.send({ type: "stop_cctv" });
    setCctvStreaming(false);
    wsStore.setStreamSource(null);
    prevUntrackedRef.current = new Set();
    streamJustStartedRef.current = false;
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
      console.error("Export failed:", err);
      toast.error("Export failed. Please try again.");
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

      {/* Center: Camera + CCTV + Assign buttons */}
      <div className="flex items-center gap-3">

        {/* Webcam buttons */}
        {!isStreaming ? (
          <button
            onClick={handleStart}
            disabled={wsState !== "open"}
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

        <span className="text-zinc-700">|</span>

        {/* CCTV buttons */}
        {!cctvStreaming ? (
          <button
            onClick={() => setShowCCTVDialog(true)}
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

        {/* Assign Workers button — only when stream active and persons in frame */}
        {showAssignButton && (
          <>
            <span className="text-zinc-700">|</span>
            <button
              onClick={() => setShowAssignModal(true)}
              className="relative flex items-center gap-2 px-5 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-sm font-semibold text-white transition-colors"
            >
              <UserCheck className="w-4 h-4" />
              Assign Workers
              {/* Badge for untracked count */}
              {untrackedCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-orange-500 rounded-full text-[9px] flex items-center justify-center font-bold">
                  {untrackedCount}
                </span>
              )}
            </button>
          </>
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
        {exporting ? "Exporting..." : "Export Data"}
      </button>

      {/* Dialogs */}
      {showCCTVDialog && (
        <CCTVDialog
          onClose={() => setShowCCTVDialog(false)}
          onStart={handleStartCCTV}
        />
      )}

      {showAssignModal && (
        <WorkerAssignmentModal
          onClose={() => setShowAssignModal(false)}
        />
      )}
    </div>
  );
}