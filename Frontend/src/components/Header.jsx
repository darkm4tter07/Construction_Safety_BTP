import { Activity } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="w-full border-b border-zinc-800 bg-zinc-900">
      <div className="flex items-center justify-between px-4 sm:px-6 py-3">

        {/* Left */}
        <div className="flex items-center gap-3 min-w-0">
          <Activity className="w-6 h-6 text-zinc-400 shrink-0" />

          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 min-w-0">
            <span className="text-zinc-100 text-base sm:text-lg font-semibold tracking-tight truncate">
              Construction Safety Monitor
            </span>
            <span className="text-xs text-zinc-500 sm:ml-2">
              v1.0
            </span>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-4">

          {/* Tagline */}
          <div className="hidden xl:block text-sm text-zinc-400 whitespace-nowrap">
            Real-time PPE, Posture & Weather Safety
          </div>

          {user && (
            <div className="flex items-center gap-3">

              {user.profile_picture && (
                <img
                  src={user.profile_picture}
                  alt={user.full_name}
                  referrerPolicy="no-referrer"
                  className="w-9 h-9 rounded-full object-cover shrink-0 border border-zinc-700 bg-zinc-800"
                />
              )}

              <div className="hidden md:block text-right leading-tight">
                <div className="text-sm text-zinc-100 font-medium truncate max-w-[130px]">
                  {user.full_name}
                </div>
                <div className="text-xs text-zinc-500 capitalize">
                  {user.role}
                </div>
              </div>

              <button
                onClick={logout}
                className="bg-zinc-200 text-zinc-900 px-3 py-1.5 text-sm font-medium rounded hover:bg-white transition focus:outline-none focus:ring-0"
              >
                Logout
              </button>

            </div>
          )}
        </div>
      </div>
    </header>

  );
}