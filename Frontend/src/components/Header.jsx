import { Activity } from "lucide-react";

export default function Header() {
  return (
    <div className="h-full px-6 flex items-center justify-between border-b border-white/10">
      <div className="flex items-center gap-3">
        <Activity className="w-7 h-7 text-blue-400" />
        <div className="text-xl font-semibold">Construction Safety Monitor</div>
        <span className="text-xs text-white/50 ml-3">v1.0</span>
      </div>
      <div className="text-white/50 text-sm">Real-time PPE, Posture & Weather Safety</div>
    </div>
  );
}
