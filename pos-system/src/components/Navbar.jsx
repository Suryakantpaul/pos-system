/**
 * Navbar.jsx
 * Top navigation bar for the POS system
 */

import React from "react";
import { ShoppingCart, Wifi, WifiOff, User, Settings, BarChart2, LogOut } from "lucide-react";
import { useCartStore } from "../store/cartStore";
import { useAuthStore, ROLES, canViewReports } from "../store/authStore";
import { useOnlineStatus } from "../hooks";
import { formatDateTime } from "../utils";
import clsx from "clsx";

const ROLE_COLORS = {
  [ROLES.ADMIN]: "bg-rose-500/20 text-rose-300 border-rose-500/30",
  [ROLES.MANAGER]: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  [ROLES.CASHIER]: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
};

export default function Navbar({ onOpenSettings, onOpenReports }) {
  const cartCount = useCartStore((s) => s.items.reduce((a, i) => a + i.quantity, 0));
  const { user, role, logout, switchRole } = useAuthStore();
  const isOnline = useOnlineStatus();
  const [now, setNow] = React.useState(new Date());

  // Live clock
  React.useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <header className="h-14 bg-[#0f1117] border-b border-white/[0.06] flex items-center px-4 gap-4 z-50 shrink-0">
      {/* Brand */}
      <div className="flex items-center gap-2.5 select-none">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
          <ShoppingCart size={16} className="text-white" />
        </div>
        <span className="font-['Syne'] font-bold text-white text-[15px] tracking-tight hidden sm:block">
          RetailOS
        </span>
        <span className="text-white/20 hidden sm:block">·</span>
        <span className="text-white/40 text-xs font-mono hidden sm:block">POS</span>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Clock */}
      <div className="hidden md:flex flex-col items-end leading-tight">
        <span className="text-white/80 text-sm font-mono tabular-nums">
          {now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </span>
        <span className="text-white/30 text-[10px]">
          {now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
        </span>
      </div>

      <div className="w-px h-5 bg-white/10 hidden md:block" />

      {/* Online Status */}
      <div
        className={clsx(
          "flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-medium",
          isOnline
            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
            : "bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse"
        )}
      >
        {isOnline ? <Wifi size={11} /> : <WifiOff size={11} />}
        <span className="hidden sm:inline">{isOnline ? "Online" : "Offline"}</span>
      </div>

      {/* Cart Count Badge */}
      {cartCount > 0 && (
        <div className="flex items-center gap-1.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs px-2.5 py-1 rounded-full font-medium">
          <ShoppingCart size={11} />
          <span>{cartCount}</span>
        </div>
      )}

      <div className="w-px h-5 bg-white/10" />

      {/* Role switcher (demo) */}
      <div className="flex items-center gap-1">
        {Object.values(ROLES).map((r) => (
          <button
            key={r}
            onClick={() => switchRole(r)}
            className={clsx(
              "text-[10px] px-2 py-0.5 rounded border capitalize font-medium transition-all",
              role === r
                ? ROLE_COLORS[r]
                : "bg-white/5 text-white/30 border-white/10 hover:text-white/50"
            )}
          >
            {r}
          </button>
        ))}
      </div>

      {/* Reports */}
      {canViewReports(role) && (
        <button
          onClick={onOpenReports}
          className="p-2 text-white/40 hover:text-white/70 hover:bg-white/5 rounded-lg transition-colors"
          title="Reports"
        >
          <BarChart2 size={17} />
        </button>
      )}

      {/* Settings */}
      <button
        onClick={onOpenSettings}
        className="p-2 text-white/40 hover:text-white/70 hover:bg-white/5 rounded-lg transition-colors"
        title="Settings"
      >
        <Settings size={17} />
      </button>

      {/* User */}
      <div className="flex items-center gap-2 pl-1">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold uppercase select-none">
          {user?.name?.[0] ?? "U"}
        </div>
        <span className="text-white/60 text-sm hidden lg:block truncate max-w-[120px]">
          {user?.name ?? "Demo User"}
        </span>
      </div>
    </header>
  );
}
