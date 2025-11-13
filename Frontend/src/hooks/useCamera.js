import { useEffect, useState } from "react";
import { cameraStore } from "../store/cameraStore";

export function useCamera() {
  const [isStreaming, setIsStreaming] = useState(cameraStore.isStreaming);

  useEffect(() => {
    // Initialize video element reference
    cameraStore.videoEl = document.getElementById("hidden-video");
    
    // Subscribe to camera state changes
    const unsubscribe = cameraStore.subscribe((streaming) => {
      setIsStreaming(streaming);
    });

    return unsubscribe;
  }, []);

  const startCamera = async () => {
    if (cameraStore.stream) {
      cameraStore.setStreaming(true);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false,
      });

      cameraStore.stream = stream;
      cameraStore.setStreaming(true);

      if (cameraStore.videoEl) {
        cameraStore.videoEl.srcObject = stream;
        await cameraStore.videoEl.play();
      }
    } catch (error) {
      console.error("Failed to start camera:", error);
      throw error;
    }
  };

  const stopCamera = () => {
    if (cameraStore.stream) {
      cameraStore.stream.getTracks().forEach((t) => t.stop());
      cameraStore.stream = null;
    }
    if (cameraStore.videoEl) {
      cameraStore.videoEl.srcObject = null;
    }
    cameraStore.setStreaming(false);
  };

  return {
    isStreaming,
    startCamera,
    stopCamera,
    getStream: () => cameraStore.stream,
    getVideoElement: () => cameraStore.videoEl,
  };
}