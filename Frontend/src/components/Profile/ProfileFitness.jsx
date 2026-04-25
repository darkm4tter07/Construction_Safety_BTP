import { Activity, Heart, Footprints, Flame, Clock, RefreshCw, Loader2, AlertTriangle } from "lucide-react";
import ConnectFitnessCTA from "./ConnectFitnessCTA";

function MetricCard({ icon: Icon, label, value, unit, color = "text-blue-400" }) {
  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-4 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-[11px] text-zinc-500 uppercase tracking-wider">{label}</span>
      </div>
      <div className="flex items-end gap-1.5">
        <span className="text-2xl font-bold text-zinc-100">
          {value ?? "—"}
        </span>
        {unit && value !== null && value !== undefined && (
          <span className="text-xs text-zinc-500 mb-0.5">{unit}</span>
        )}
      </div>
    </div>
  );
}

function SyncInfo({ lastSynced }) {
  if (!lastSynced) return null;
  const date = new Date(lastSynced);
  return (
    <p className="text-[11px] text-zinc-500">
      Last synced: {date.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      })} · {date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
      })}
    </p>
  );
}

export default function ProfileFitness({
  workerData,
  isAdminView,
  profileUser,
}) {
  const {
    fitnessData,
    fitnessConnected,
    loading,
    needsReauth,
    fetchFitnessData,
    handleConnectFitness,
    handleDisconnect,
    handleAdminDisconnect,
    getBMI,
    getBMICategory,
  } = workerData;

  const bmi = getBMI();
  const bmiCategory = getBMICategory(bmi);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  // Worker not connected
  if (!isAdminView && !fitnessConnected) {
    return (
      <div className="max-w-3xl mx-auto pb-8">
        <ConnectFitnessCTA onConnect={handleConnectFitness} />
      </div>
    );
  }

  // Needs reauth
  if (needsReauth) {
    return (
      <div className="max-w-3xl mx-auto pb-8">
        <div className="bg-yellow-900/20 border border-yellow-800 rounded-xl px-5 py-6 flex flex-col items-center gap-3 text-center">
          <AlertTriangle className="w-7 h-7 text-yellow-400" />
          <p className="text-sm font-semibold text-yellow-400">
            Fitness sync needs attention
          </p>
          <p className="text-xs text-zinc-400">
            {isAdminView
              ? `Ask ${profileUser?.full_name?.split(' ')[0]} to log in again to restore fitness sync`
              : "Please log in again to restore your fitness sync"}
          </p>
          {!isAdminView && (
            <button
              onClick={handleConnectFitness}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 rounded-lg text-xs font-semibold text-white transition mt-1"
            >
              Reconnect Google Fit
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-4 pb-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-zinc-200">
            {isAdminView
              ? `${profileUser?.full_name?.split(' ')[0]}'s Fitness`
              : "My Fitness"}
          </h2>
          <p className="text-[11px] text-zinc-500 mt-0.5">Today's data from Google Fit</p>
        </div>
        <button
          onClick={fetchFitnessData}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-400 hover:text-white border border-zinc-700 rounded-lg transition"
        >
          <RefreshCw className="w-3 h-3" />
          Refresh
        </button>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard
          icon={Footprints}
          label="Steps"
          value={fitnessData?.steps?.toLocaleString()}
          color="text-blue-400"
        />
        <MetricCard
          icon={Heart}
          label="Heart Rate"
          value={fitnessData?.heart_rate || 0}
          unit="bpm"
          color="text-red-400"
        />
        <MetricCard
          icon={Flame}
          label="Calories"
          value={fitnessData?.calories}
          unit="kcal"
          color="text-orange-400"
        />
        <MetricCard
          icon={Clock}
          label="Active"
          value={fitnessData?.active_minutes ?? "—"}
          unit="min"
          color="text-green-400"
        />
      </div>

      {/* BMI Card */}
      {bmi && (
        <div className="bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-zinc-400" />
              <span className="text-[11px] text-zinc-500 uppercase tracking-wider">Body Mass Index</span>
            </div>
            {bmiCategory && (
              <span className={`text-xs font-semibold ${bmiCategory.color}`}>
                {bmiCategory.label}
              </span>
            )}
          </div>

          {/* BMI bar */}
          <div className="relative h-2 bg-zinc-700 rounded-full overflow-hidden mb-2">
            <div className="absolute inset-y-0 left-0 w-[30%] bg-blue-500 rounded-full" />
            <div className="absolute inset-y-0 left-[30%] w-[20%] bg-green-500 rounded-full" />
            <div className="absolute inset-y-0 left-[50%] w-[20%] bg-yellow-500 rounded-full" />
            <div className="absolute inset-y-0 left-[70%] w-[30%] bg-red-500 rounded-full" />
            {/* Marker */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full border-2 border-zinc-900 shadow"
              style={{
                left: `${Math.min(Math.max(((parseFloat(bmi) - 10) / 30) * 100, 0), 97)}%`
              }}
            />
          </div>

          <div className="flex justify-between text-[9px] text-zinc-600">
            <span>Underweight</span>
            <span>Normal</span>
            <span>Overweight</span>
            <span>Obese</span>
          </div>

          <p className="text-center text-lg font-bold text-zinc-100 mt-3">
            {bmi} <span className="text-xs font-normal text-zinc-400">kg/m²</span>
          </p>
        </div>
      )}

      {/* Connection info */}
      <div className="bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-xs text-zinc-400">Connected via Google Fit</span>
        </div>
        <div className="flex items-center gap-3">
          {fitnessData?.date && (
            <span className="text-[11px] text-zinc-500">
              {new Date(fitnessData.date).toLocaleDateString('en-IN', {
                day: '2-digit', month: 'short', year: 'numeric'
              })}
            </span>
          )}
          <button
            onClick={isAdminView ? handleAdminDisconnect : handleDisconnect}
            className="text-[11px] text-red-400 hover:text-red-300 border border-red-900/50 px-2 py-1 rounded-lg transition"
          >
            Disconnect
          </button>
        </div>
      </div>
    </div>
  );
}