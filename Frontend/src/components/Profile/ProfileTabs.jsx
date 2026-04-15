import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, UserPen, Brain, Activity } from "lucide-react";

export default function ProfileTabs({ isAdminView, userId }) {
  const base = isAdminView ? `/admin/worker/${userId}` : "/worker/profile";

  const tabs = [
    {
      label: "Overview",
      path: base,
      icon: LayoutDashboard,
      end: true,
    },
    {
      label: "Edit Profile",
      path: `${base}/edit`,
      icon: UserPen,
      end: false,
    },
    {
      label: "Cognitive Test",
      path: `${base}/cognitive`,
      icon: Brain,
      end: false,
    },
    {
      label: "Fitness",
      path: `${base}/fitness`,
      icon: Activity,
      end: false,
    },
  ];

  return (
    <div className="w-full border-b border-zinc-700 bg-zinc-900 sticky top-0 z-10">
      <div className="flex overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              end={tab.end}
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 sm:px-5 py-3 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
                  isActive
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-zinc-400 hover:text-zinc-200"
                }`
              }
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{tab.label}</span>
            </NavLink>
          );
        })}
      </div>
    </div>
  );
}