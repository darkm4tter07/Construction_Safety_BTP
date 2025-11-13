// Global WebSocket manager: single socket, single source-of-truth state
const WS_URL = "ws://localhost:8000/ws";

export const wsStore = {
  socket: null,
  
  // Global states
  wsState: "closed",
  fps: 0,
  frames: { object: null, pose: null },
  lastResult: null,
  pendingFrames: 0,
  
  // Subscribers
  subs: new Set(),
  
  // Notify all subscribers
  notify() {
    const snap = {
      wsState: this.wsState,
      fps: this.fps,
      frames: { ...this.frames },
      lastResult: this.lastResult ? { ...this.lastResult } : null,
    };
    this.subs.forEach((cb) => {
      try {
        cb(snap);
      } catch (e) {
        console.warn("[wsStore] subscriber error", e);
      }
    });
  },
  
  // Subscribe to state changes
  subscribe(cb) {
    this.subs.add(cb);
    // Immediately send current state
    cb({
      wsState: this.wsState,
      fps: this.fps,
      frames: { ...this.frames },
      lastResult: this.lastResult ? { ...this.lastResult } : null,
    });
    return () => this.subs.delete(cb);
  },
  
  // Ensure WebSocket connection exists
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
        // Decrement pending frames
        this.pendingFrames = Math.max(0, this.pendingFrames - 1);
        
        // Update frames (don't overwrite with null/undefined)
        this.frames = {
          object: msg.frame_object ?? this.frames.object,
          pose: msg.frame_pose ?? this.frames.pose,
        };
        
        // Update last result
        this.lastResult = {
          detections: msg.detections ?? this.lastResult?.detections ?? null,
          posture: msg.posture ?? this.lastResult?.posture ?? null,
        };
        
        this.fps = msg.fps ?? this.fps;
        this.notify();
        
      } else if (msg.type === "error") {
        console.warn("[wsStore] Backend error:", msg.message);
      }
    };
  },
  
  // Send data through WebSocket
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
  
  // Clear all frames and results
  clearFrames() {
    console.log("[wsStore] 🧹 Clearing frames");
    this.frames = { object: null, pose: null };
    this.lastResult = null;
    this.fps = 0;
    this.pendingFrames = 0;
    this.notify();
  },
  
  // Close WebSocket connection
  close() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.wsState = "closed";
    this.notify();
  }
};