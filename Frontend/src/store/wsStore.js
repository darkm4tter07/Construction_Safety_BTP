const WS_URL = "ws://localhost:8000/ws";

export const wsStore = {
  socket: null,

  //Initial States
  cctvStatus: null,
  streamSource: null,

  // Global states
  wsState: "closed",
  fps: 0,
  frames: { object: null, pose: null },
  lastResult: null,
  pendingFrames: 0,
  lastError: null,

  // Tracking state
  activeTracks: {},
  newUntracked: [],
  lostWorkers: [],

  // Subscribers
  subs: new Set(),

  setStreamSource(source) {
    this.streamSource = source;
    this.notify();
  },

  notify() {
    const snap = {
      wsState: this.wsState,
      fps: this.fps,
      frames: { ...this.frames },
      lastResult: this.lastResult ? { ...this.lastResult } : null,
      cctvStatus: this.cctvStatus,
      streamSource: this.streamSource,
      lastError: this.lastError,
      // tracking
      activeTracks: this.activeTracks,
      newUntracked: this.newUntracked,
      lostWorkers: this.lostWorkers,
    };
    this.subs.forEach((cb) => {
      try {
        cb(snap);
      } catch (e) {
        console.warn("[wsStore] subscriber error", e);
      }
    });
  },

  subscribe(cb) {
    this.subs.add(cb);
    cb({
      wsState: this.wsState,
      fps: this.fps,
      frames: { ...this.frames },
      lastResult: this.lastResult ? { ...this.lastResult } : null,
      cctvStatus: this.cctvStatus,
      streamSource: this.streamSource,
      lastError: this.lastError,
      // tracking
      activeTracks: this.activeTracks,
      newUntracked: this.newUntracked,
      lostWorkers: this.lostWorkers,
    });
    return () => this.subs.delete(cb);
  },

  ensureSocket() {
    if (this.socket) return;

    try {
      this.socket = new WebSocket(WS_URL);
    } catch (e) {
      console.warn("[wsStore] WebSocket constructor failed", e);
      this.wsState = "closed";
      this.notify();
      return;
    }

    this.socket.onopen = () => {
      console.log("[wsStore] ✅ Connected");
      this.wsState = "open";
      this.pendingFrames = 0;
      this.notify();
    };

    this.socket.onclose = () => {
      console.log("[wsStore] ❌ Disconnected");
      this.wsState = "closed";
      this.socket = null;
      this.notify();
    };

    this.socket.onerror = (err) => {
      console.warn("[wsStore] ⚠️ Socket error", err);
      this.wsState = "error";
      this.notify();
    };

    this.socket.onmessage = (e) => {
      let msg;
      try {
        msg = JSON.parse(e.data);
      } catch (err) {
        console.warn("[wsStore] Non-JSON message", err);
        return;
      }

      if (msg.type === "result") {
        this.pendingFrames = Math.max(0, this.pendingFrames - 1);
        this.streamSource = msg.source ?? this.streamSource;

        this.frames = {
          object: msg.frame_object ?? this.frames.object,
          pose: msg.frame_pose ?? this.frames.pose,
        };

        this.lastResult = {
          detections: msg.detections ?? this.lastResult?.detections ?? null,
          posture: msg.posture ?? this.lastResult?.posture ?? null,
        };

        this.fps = msg.fps ?? this.fps;

        // --- tracking ---
        this.activeTracks = msg.active_tracks ?? this.activeTracks;
        this.newUntracked = msg.new_untracked ?? [];
        this.lostWorkers = msg.lost_workers ?? [];

        this.notify();

      } else if (msg.type === "cctv_status") {
        console.log("[wsStore] CCTV status:", msg.status);
        this.cctvStatus = msg.status;
        this.notify();

      } else if (msg.type === "tracking_reset") {
        this.activeTracks = {};
        this.newUntracked = [];
        this.lostWorkers = [];
        this.notify();

      } else if (msg.type === "error") {
        console.warn("[wsStore] Backend error:", msg.message);
        this.lastError = msg.message;
        this.notify();
      }
    };
  },

  send(payload) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return false;
    }
    try {
      this.socket.send(JSON.stringify(payload));
      this.pendingFrames += 1;
      return true;
    } catch (e) {
      console.warn("[wsStore] Send failed", e);
      return false;
    }
  },

  clearFrames() {
    console.log("[wsStore] 🧹 Clearing frames");
    this.frames = { object: null, pose: null };
    this.lastResult = null;
    this.fps = 0;
    this.pendingFrames = 0;
    this.cctvStatus = null;
    this.streamSource = null;
    this.lastError = null;
    // reset tracking too
    this.activeTracks = {};
    this.newUntracked = [];
    this.lostWorkers = [];
    this.notify();
  },

  close() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.wsState = "closed";
    this.notify();
  },
};