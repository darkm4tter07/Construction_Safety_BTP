import { useEffect, useRef } from "react";
import { cameraStore } from "../store/cameraStore";
import { wsStore } from "../store/wsStore";

export function useFrameSender() {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const lastSendRef = useRef(0);

  useEffect(() => {
    const sendLoop = () => {
      // Check if camera is streaming
      if (!cameraStore.isStreaming) {
        animRef.current = requestAnimationFrame(sendLoop);
        return;
      }

      // Check WebSocket state
      if (wsStore.wsState !== "open") {
        animRef.current = requestAnimationFrame(sendLoop);
        return;
      }

      // Check video element
      const video = cameraStore.videoEl;
      if (!video || video.readyState < 2) {
        animRef.current = requestAnimationFrame(sendLoop);
        return;
      }

      // Backpressure: wait if backend is processing
      if (wsStore.pendingFrames > 2) {
        animRef.current = requestAnimationFrame(sendLoop);
        return;
      }

      // Rate limiting: 5 FPS (200ms gap)
      const now = Date.now();
      if (now - lastSendRef.current < 200) {
        animRef.current = requestAnimationFrame(sendLoop);
        return;
      }

      lastSendRef.current = now;

      // Create canvas if needed
      const canvas = canvasRef.current || (canvasRef.current = document.createElement("canvas"));
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert to blob and send
      canvas.toBlob(
        (blob) => {
          if (!blob) return;

          const reader = new FileReader();
          reader.onloadend = () => {
            wsStore.send({
              type: "frame",
              frame: reader.result,
            });
          };
          reader.readAsDataURL(blob);
        },
        "image/jpeg",
        0.85
      );

      animRef.current = requestAnimationFrame(sendLoop);
    };

    animRef.current = requestAnimationFrame(sendLoop);

    return () => {
      if (animRef.current) {
        cancelAnimationFrame(animRef.current);
      }
    };
  }, []);
}