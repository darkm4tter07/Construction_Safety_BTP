import { useState } from "react";
import { Activity } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export default function Header() {
  const { user, logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const displayPhoto = user?.profile?.profile_photo_url || user?.profile_picture;

  return (
    <>
      <header className="w-full border-b border-zinc-800 bg-zinc-900">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3">

          {/* Left */}
          <div className="flex items-center gap-3 min-w-0">
            <Activity className="w-6 h-6 text-zinc-400 shrink-0" />
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 min-w-0">
              <span className="text-zinc-100 text-base sm:text-lg font-semibold tracking-tight truncate">
                Construction Safety Monitor
              </span>
              <span className="text-xs text-zinc-500 sm:ml-2">v1.0</span>
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-4">
            <div className="hidden xl:block text-sm text-zinc-400 whitespace-nowrap">
              Real-time PPE, Posture & Weather Safety
            </div>

            {user && (
              <div className="flex items-center gap-3">
                {displayPhoto && (
                  <img
                    src={displayPhoto}
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
                    {user.role?.toLowerCase()}
                  </div>
                </div>
                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  className="bg-zinc-200 text-zinc-900 px-3 py-1.5 text-sm font-medium rounded hover:bg-white transition focus:outline-none focus:ring-0 cursor-pointer"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Logout confirmation modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden w-full max-w-sm">
            <div className="px-5 py-4 border-b border-zinc-700">
              <h3 className="text-sm font-semibold text-white">Confirm Logout</h3>
            </div>
            <div className="px-5 py-4">
              <p className="text-xs text-zinc-400">
                Are you sure you want to log out? Any active streams will be stopped.
              </p>
              {user && (
                <div className="flex items-center gap-3 mt-4 p-3 bg-zinc-800 rounded-lg">
                  {displayPhoto && (
                    <img
                      src={displayPhoto}
                      alt={user.full_name}
                      className="w-8 h-8 rounded-full object-cover border border-zinc-700"
                    />
                  )}
                  <div>
                    <p className="text-xs font-medium text-zinc-200">{user.full_name}</p>
                    <p className="text-[11px] text-zinc-500 capitalize">{user.role?.toLowerCase()}</p>
                  </div>
                </div>
              )}
            </div>
            <div className="px-5 py-3 border-t border-zinc-700 flex gap-2 justify-end">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 text-xs text-zinc-400 hover:text-white border border-zinc-700 rounded-lg transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowLogoutConfirm(false);
                  logout();
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-xs font-semibold text-white transition cursor-pointer"
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}