import { useState } from "react";
import { X, Tv2 } from "lucide-react";

const TABS = [
  { id: "rtsp", label: "RTSP / IP Cam", placeholder: "rtsp://192.168.1.100:554/stream" },
  { id: "file", label: "Video File", placeholder: "app/uploads/test.mp4" },
  { id: "hls",  label: "HLS / HTTP",  placeholder: "http://192.168.1.100:8080/stream.m3u8" },
];

export default function CCTVDialog({ onClose, onStart }) {
  const [activeTab, setActiveTab] = useState("rtsp");
  const [url, setUrl] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const currentTab = TABS.find(t => t.id === activeTab);

  const handleStart = () => {
    const trimmed = url.trim();
    if (!trimmed) return;

    // Validate per tab
    if (activeTab === "rtsp") {
      if (!trimmed.startsWith("rtsp://") && !trimmed.startsWith("rtsps://")) {
        setError("RTSP URL must start with rtsp:// or rtsps://");
        return;
      }
    } else if (activeTab === "hls") {
      if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
        setError("HLS URL must start with http:// or https://");
        return;
      }
    } else if (activeTab === "file") {
      if (trimmed.includes("://")) {
        setError("For a file path, don't include a protocol. E.g. app/uploads/test.mp4");
        return;
      }
      if (!/\.(mp4|avi|mkv|mov|webm)$/i.test(trimmed)) {
        setError("Unsupported file type. Use mp4, avi, mkv, mov, or webm.");
        return;
      }
    }

    // Clear error and proceed
    setError("");
    let finalPath = trimmed;
    if (activeTab === "rtsp" && username.trim()) {
      try {
        const parsed = new URL(trimmed);
        parsed.username = username.trim();
        parsed.password = password.trim();
        finalPath = parsed.toString();
      } catch {
        setError("Invalid RTSP URL format.");
        return;
      }
    }

    onStart(finalPath);
    onClose();
  };

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Dialog */}
      <div className="w-[460px] bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl overflow-hidden">

        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-700 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-purple-600 flex items-center justify-center shrink-0">
              <Tv2 className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-100">Start CCTV Stream</p>
              <p className="text-[11px] text-zinc-400">Configure source before streaming</p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-200 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-5 pt-4">
          <div className="flex gap-1 bg-zinc-800 rounded-lg p-1">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setUrl(""); setError(""); }}
                className={`flex-1 text-[11px] font-medium py-1.5 rounded-md transition-colors cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-purple-600 text-white"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <div className="px-5 py-4 flex flex-col gap-3">
          <div>
            <label className="text-[11px] text-zinc-400 block mb-1.5">
              {activeTab === "file" ? "File path on server" : "Stream URL"}
            </label>
            <input
              type="text"
              value={url}
              onChange={e => { setUrl(e.target.value); setError(""); }}
              onKeyDown={e => e.key === "Enter" && handleStart()}
              placeholder={currentTab.placeholder}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors"
            />
          </div>

          {/* RTSP credentials — only shown for RTSP tab */}
          {activeTab === "rtsp" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-zinc-400 block mb-1.5">
                  Username <span className="text-zinc-600">(optional)</span>
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors"
                />
              </div>
              <div>
                <label className="text-[11px] text-zinc-400 block mb-1.5">
                  Password <span className="text-zinc-600">(optional)</span>
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors"
                />
              </div>
            </div>
          )}

          {error && (
            <p className="text-[11px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          {/* Info note per tab */}
          <p className="text-[11px] text-zinc-500">
            {activeTab === "rtsp" && "Supports any RTSP-compatible IP camera. Credentials are embedded into the URL."}
            {activeTab === "file" && "Path is relative to the FastAPI server root. E.g. app/uploads/test.mp4"}
            {activeTab === "hls"  && "Any publicly accessible HLS or MJPEG HTTP stream URL."}
          </p>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-zinc-700 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleStart}
            disabled={!url.trim()}
            className="flex items-center gap-2 px-5 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-xs font-semibold text-white transition-colors cursor-pointer"
          >
            <Tv2 className="w-3.5 h-3.5" />
            Start Stream
          </button>
        </div>
      </div>
    </div>
  );
}