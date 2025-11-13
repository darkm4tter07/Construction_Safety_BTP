export default function RiskLegend() {
  return (
    <div className="w-full bg-gray-800 rounded-xl shadow-xl overflow-hidden">
      <div className="px-4 py-2 border-b border-white/10 font-semibold">Risk Levels</div>
      <div className="p-3 text-sm space-y-2">
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-green-500" /> Low</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-yellow-500" /> Medium</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-red-500" /> High</div>
      </div>
    </div>
  );
}
