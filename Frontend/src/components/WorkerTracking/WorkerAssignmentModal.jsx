import { useEffect, useRef, useState } from "react";
import { X, UserCheck, UserX, RotateCcw, Loader2 } from "lucide-react";
import { useWorkerTracking } from "../../hooks/useWorkerTracking";
import { wsStore } from "../../store/wsStore";

const ROLE_OPTIONS = [
  { value: "supervisor", label: "Supervisor" },
  { value: "not_worker", label: "Not Worker" },
];

export default function WorkerAssignmentModal({ onClose }) {
  const canvasRef = useRef(null);
  const itemRefs = useRef({});
  const [frozenFrame, setFrozenFrame] = useState(null);
  const [selectedTrackId, setSelectedTrackId] = useState(null);
  const [dropdownPos, setDropdownPos] = useState({ x: 0, y: 0 });
  const [canvasDims, setCanvasDims] = useState({ width: 640, height: 480 });

  const {
    activeTracks,
    assignableTracks,
    workers,
    assignedWorkerIds,
    loading,
    fetchTrackingData,
    assignWorker,
    unassignWorker,
    resetTracking,
  } = useWorkerTracking();

  useEffect(() => {
    const currentFrame = wsStore.frames.object;
    if (currentFrame) setFrozenFrame(currentFrame);
    fetchTrackingData();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !frozenFrame) return;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      setCanvasDims({ width: img.width, height: img.height });
      ctx.drawImage(img, 0, 0);
      drawBoundingBoxes(ctx, activeTracks, assignableTracks);
    };
    img.src = frozenFrame;
  }, [frozenFrame, activeTracks, assignableTracks]);

  const drawBoundingBoxes = (ctx, tracks, unassigned) => {
    Object.entries(tracks).forEach(([trackId, data]) => {
      if (!data.bbox) return;
      const [x1, y1, x2, y2] = data.bbox;
      const isAssigned = !!data.worker;
      const isSelected = selectedTrackId === parseInt(trackId);

      if (isSelected) {
        ctx.strokeStyle = "#facc15";
      } else if (isAssigned) {
        ctx.strokeStyle = "#22c55e";
      } else {
        ctx.strokeStyle = "#f97316";
      }

      ctx.lineWidth = 2;
      ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);

      const label = isAssigned ? data.worker.name : `Person #${trackId}`;
      ctx.font = "12px sans-serif";
      const textWidth = ctx.measureText(label).width;
      ctx.fillStyle = isAssigned ? "#22c55e" : "#f97316";
      ctx.fillRect(x1, y1 - 18, textWidth + 8, 18);
      ctx.fillStyle = "#ffffff";
      ctx.fillText(label, x1 + 4, y1 - 4);
    });
  };

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    for (const [trackId, data] of Object.entries(activeTracks)) {
      if (!data.bbox) continue;
      const [x1, y1, x2, y2] = data.bbox;
      if (clickX >= x1 && clickX <= x2 && clickY >= y1 && clickY <= y2) {
        const id = parseInt(trackId);
        setSelectedTrackId(id);
        setDropdownPos({
          x: Math.min(e.clientX + 10, window.innerWidth - 220),
          y: Math.min(e.clientY, window.innerHeight - 300),
        });
        return;
      }
    }
    setSelectedTrackId(null);
  };

  const handleRightPanelClick = (trackId, e) => {
    const id = parseInt(trackId);
    setSelectedTrackId(id);
    const el = itemRefs.current[trackId];
    if (el) {
      const rect = el.getBoundingClientRect();
      setDropdownPos({
        x: Math.max(rect.left - 212, 8),
        y: Math.min(rect.top, window.innerHeight - 300),
      });
    }
  };

  const handleSelectWorker = async (worker) => {
    if (!selectedTrackId) return;
    await assignWorker(selectedTrackId, worker);
    setSelectedTrackId(null);
  };

  const handleSelectRole = async (role, label) => {
    if (!selectedTrackId) return;
    await assignWorker(selectedTrackId, {
      worker_id: `${role}_${selectedTrackId}`,
      google_id: `${role}_${selectedTrackId}`,
      name: label,
      profile_picture: null,
      role: role,
    });
    setSelectedTrackId(null);
  };

  const handleUnassign = async (trackId) => {
    await unassignWorker(trackId);
    setSelectedTrackId(null);
  };

  const totalPersons = Object.keys(activeTracks).length;
  const assignedCount = Object.values(activeTracks).filter(t => t.worker).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-[90vw] max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-700">
          <div className="flex items-center gap-3">
            <UserCheck className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-semibold text-white">Worker Assignment</span>
            {!loading && (
              <span className="text-[11px] text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-full">
                {assignedCount}/{totalPersons} assigned
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={resetTracking}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 rounded-lg transition"
            >
              <RotateCcw className="w-3 h-3" />
              Reset All
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden min-h-0">

          {/* Left: Canvas */}
          <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
                <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
              </div>
            )}
            {!frozenFrame && !loading && (
              <p className="text-zinc-500 text-sm">No frame available. Start a stream first.</p>
            )}
            {frozenFrame && (
              <canvas
                ref={canvasRef}
                onClick={handleCanvasClick}
                className="max-w-full max-h-full cursor-crosshair"
                style={{ imageRendering: "pixelated" }}
              />
            )}
            {frozenFrame && !loading && (
              <div className="absolute bottom-3 left-3 text-[10px] text-zinc-500 bg-black/50 px-2 py-1 rounded">
                Click on a person to assign
              </div>
            )}
          </div>

          {/* Right: Assignment list */}
          <div className="w-56 border-l border-zinc-700 flex flex-col overflow-hidden">
            <div className="px-3 py-2 border-b border-zinc-700">
              <span className="text-[11px] text-zinc-400 uppercase tracking-wider">In Frame</span>
            </div>
            <div className="flex-1 overflow-y-auto">
              {totalPersons === 0 && !loading && (
                <p className="text-xs text-zinc-500 text-center mt-6 px-3">
                  No persons detected in frame
                </p>
              )}
              {Object.entries(activeTracks).map(([trackId, data]) => (
                <div
                  key={trackId}
                  ref={el => itemRefs.current[trackId] = el}
                  onClick={(e) => handleRightPanelClick(trackId, e)}
                  className={`px-3 py-2.5 border-b border-zinc-800 cursor-pointer hover:bg-zinc-800 transition ${
                    selectedTrackId === parseInt(trackId) ? "bg-zinc-800 border-l-2 border-l-yellow-400" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-300 font-medium">
                      Person #{trackId}
                    </span>
                    {data.worker && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleUnassign(parseInt(trackId)); }}
                        className="text-zinc-600 hover:text-red-400 transition"
                      >
                        <UserX className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  {data.worker ? (
                    <div className="flex items-center gap-1.5 mt-1">
                      {data.worker.profile_picture && (
                        <img src={data.worker.profile_picture} className="w-4 h-4 rounded-full" />
                      )}
                      <span className="text-[11px] text-green-400 truncate">{data.worker.name}</span>
                    </div>
                  ) : (
                    <span className="text-[11px] text-orange-400">Unassigned</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 border-t border-zinc-700 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-sm bg-orange-500" />
              <span className="text-[10px] text-zinc-400">Unassigned</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-sm bg-green-500" />
              <span className="text-[10px] text-zinc-400">Assigned worker</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-sm bg-purple-500" />
              <span className="text-[10px] text-zinc-400">Supervisor</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-sm bg-zinc-500" />
              <span className="text-[10px] text-zinc-400">Not worker</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-sm bg-yellow-400" />
              <span className="text-[10px] text-zinc-400">Selected</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-semibold text-white transition"
          >
            Done
          </button>
        </div>
      </div>

      {/* Floating dropdown */}
      {selectedTrackId !== null && (
        <div
          className="fixed z-[60] bg-zinc-800 border border-zinc-600 rounded-lg shadow-xl overflow-hidden w-52"
          style={{ left: dropdownPos.x, top: dropdownPos.y }}
        >
          <div className="px-3 py-2 border-b border-zinc-700 flex items-center justify-between">
            <span className="text-[11px] text-zinc-400">
              Assign Person #{selectedTrackId}
            </span>
            <button
              onClick={() => setSelectedTrackId(null)}
              className="text-zinc-500 hover:text-white transition"
            >
              <X className="w-3 h-3" />
            </button>
          </div>

          <div className="max-h-48 overflow-y-auto">
            {workers.length === 0 && (
              <p className="text-xs text-zinc-500 text-center py-3">No workers found</p>
            )}
            {workers.map((worker) => {
              const isAlreadyAssigned = assignedWorkerIds.includes(worker.worker_id);
              return (
                <button
                  key={worker.worker_id}
                  onClick={() => !isAlreadyAssigned && handleSelectWorker(worker)}
                  disabled={isAlreadyAssigned}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-zinc-700 transition ${
                    isAlreadyAssigned ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
                  }`}
                >
                  {worker.profile_picture ? (
                    <img src={worker.profile_picture} className="w-6 h-6 rounded-full shrink-0" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-zinc-600 flex items-center justify-center text-[10px] shrink-0">
                      {worker.name?.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-zinc-200 truncate">{worker.name}</div>
                    {worker.employee_id && (
                      <div className="text-[10px] text-zinc-500">{worker.employee_id}</div>
                    )}
                  </div>
                  {isAlreadyAssigned && (
                    <span className="text-[9px] text-zinc-500 shrink-0">assigned</span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="border-t border-zinc-700" />

          {ROLE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleSelectRole(opt.value, opt.label)}
              className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-zinc-700 transition cursor-pointer"
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] shrink-0 ${
                opt.value === "supervisor" ? "bg-purple-700" : "bg-zinc-600"
              }`}>
                {opt.label.charAt(0)}
              </div>
              <span className="text-xs text-zinc-300">{opt.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}