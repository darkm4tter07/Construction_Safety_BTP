import './App.css';
import Dashboard from "./pages/Dashboard";
import { useFrameSender } from "./hooks/useFrameSender";

export default function App() {
  // Initialize frame sender globally (runs once)
  useFrameSender();

  return (
    <>
      {/* Hidden video element for camera stream */}
      <video id="hidden-video" style={{ display: "none" }} autoPlay playsInline muted />
      <Dashboard />
    </>
  );
}