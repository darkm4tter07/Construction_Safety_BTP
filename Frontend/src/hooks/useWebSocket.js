import { useEffect, useState } from "react";
import { wsStore } from "../store/wsStore";

export function useWebSocket() {
  const [state, setState] = useState({
    wsState: wsStore.wsState,
    fps: wsStore.fps,
    frames: wsStore.frames,
    lastResult: wsStore.lastResult,
  });

  useEffect(() => {
    // Ensure WebSocket is connected
    wsStore.ensureSocket();

    // Subscribe to store updates
    const unsubscribe = wsStore.subscribe((snapshot) => {
      setState(snapshot);
    });

    return unsubscribe;
  }, []);

  return {
    wsState: state.wsState,
    fps: state.fps,
    frames: state.frames,
    lastResult: state.lastResult,
    clearFrames: () => wsStore.clearFrames(),
  };
}