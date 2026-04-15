import { useEffect, useState } from "react";
import { wsStore } from "../store/wsStore";

export function useWebSocket() {
  const [state, setState] = useState({
    wsState: wsStore.wsState,
    fps: wsStore.fps,
    frames: wsStore.frames,
    lastResult: wsStore.lastResult,
    cctvStatus: wsStore.cctvStatus,
    streamSource: wsStore.streamSource,
    lastError: wsStore.lastError,
    activeTracks: wsStore.activeTracks,
    newUntracked: wsStore.newUntracked,
    lostWorkers: wsStore.lostWorkers,
  });

  useEffect(() => {
    wsStore.ensureSocket();

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
    streamSource: state.streamSource,
    isAnyStreamActive: !!state.streamSource,
    lastError: state.lastError,
    clearFrames: () => wsStore.clearFrames(),
    // tracking
    activeTracks: state.activeTracks,
    newUntracked: state.newUntracked,
    lostWorkers: state.lostWorkers,
  };
}