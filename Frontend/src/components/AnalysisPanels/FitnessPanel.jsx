import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AUTH_URL as API_URL } from "../../Constant";

export default function FitnessPanel() {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    fetchWorkers();
  }, []);

  const fetchWorkers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/fitness/connected-workers`);
      setWorkers(response.data.workers || []);
    } catch (error) {
      console.error("Failed to fetch workers:", error);
    } finally {
      setLoading(false);
    }
  };

  // derive directly from workers (single source of truth)
  const expiredWorkers = workers.filter(w => w.needs_reauth);

  return (
    <div className="w-[320px] lg:w-[350px] shrink-0 h-full bg-zinc-800 rounded-xl border border-zinc-700 overflow-hidden flex flex-col">

      {/* Header */}
      <div className="px-4 py-2.5 border-b border-zinc-700 bg-zinc-700/30 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold tracking-widest text-zinc-300 uppercase">
            Worker Fitness
          </span>
          {!loading && (
            <span className="text-[10px] text-zinc-300 bg-zinc-700/50 px-1.5 py-0.5 rounded-full">
              {workers.length}
            </span>
          )}
        </div>
        <button
          onClick={fetchWorkers}
          className="text-[11px] cursor-pointer text-zinc-400 hover:text-white"
        >
          Refresh
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">

        {loading && (
          <div className="flex items-center justify-center h-full">
            <span className="text-xs text-zinc-400">Loading...</span>
          </div>
        )}

        {!loading && workers.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-xs text-zinc-400 text-center px-6">
              No workers connected to Google Fit yet
            </p>
          </div>
        )}

        {!loading && workers.length > 0 && (
          <div className="divide-y divide-zinc-700">
            {workers.map((worker) => (
              <button
                key={worker.id}
                onClick={() => navigate(`/admin/worker/${worker.id}`)}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-zinc-700/50 text-left"
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  {worker.profile_picture ? (
                    <img
                      src={worker.profile_picture}
                      alt={worker.full_name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs">
                      {worker.full_name?.charAt(0)}
                    </div>
                  )}

                  {/* Status dot */}
                  <span
                    className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border border-zinc-800 ${
                      worker.needs_reauth ? "bg-yellow-500" : "bg-green-500"
                    }`}
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-zinc-200 truncate">
                    {worker.full_name}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Metric value={worker.steps ?? 0} label="steps" />
                    <Dot />
                    <Metric value={worker.heart_rate ?? 0} label="bpm" />
                    <Dot />
                    <Metric value={worker.calories ?? 0} label="kcal" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-zinc-700 flex flex-col gap-1">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
          <span className="text-[10px] text-zinc-400">
            {workers.length} connected via Google Fit
          </span>
        </div>

        {expiredWorkers.length > 0 && (
          <div className="text-[10px] text-yellow-400">
            ⚠️ {expiredWorkers.length} worker(s) need re-login
          </div>
        )}
      </div>
    </div>
  );
}

const Metric = ({ value, label }) => (
  <span className="text-[11px] text-zinc-400">
    <span className="text-zinc-300 font-medium">{value}</span> {label}
  </span>
);

const Dot = () => (
  <span className="text-zinc-600 text-[10px]">·</span>
);