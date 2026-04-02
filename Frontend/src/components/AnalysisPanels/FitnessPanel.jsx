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
      const response = await axios.get(
        `${API_URL}/fitness/connected-workers`
      );
      setWorkers(response.data.workers || []);
    } catch (error) {
      console.error("Failed to fetch workers:", error);
    } finally {
      setLoading(false);
    }
  };

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
          className="text-[11px] cursor-pointer text-zinc-400 hover:text-white transition-colors duration-200"
        >
          Refresh
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">

        {loading && (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-2">
              <div className="w-4 h-4 border border-zinc-500 border-t-zinc-200 rounded-full animate-spin" />
              <span className="text-xs text-zinc-400">loading</span>
            </div>
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
                className="cursor-pointer w-full px-4 py-3 flex items-center gap-3 hover:bg-zinc-700/50 active:bg-zinc-700/70 transition-colors duration-150 group text-left"
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
                    <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs text-zinc-300 font-medium">
                      {worker.full_name?.charAt(0)}
                    </div>
                  )}
                  {/* Online dot */}
                  <span className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border border-zinc-800" />
                </div>

                {/* Name + metrics */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-zinc-200 truncate group-hover:text-white transition-colors">
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

                {/* Arrow */}
                <svg
                  className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300 transition-all duration-200 group-hover:translate-x-0.5 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-zinc-700 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
        <span className="text-[10px] text-zinc-400">
          {workers.length} connected via Google Fit
        </span>
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