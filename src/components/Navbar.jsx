/**
 * Navbar.jsx
 * Upgraded top navigation bar for the POS system
 */
import logo from "../assets/logo.svg";
import React, { useState } from "react";
import {
  ShoppingCart, Wifi, WifiOff, Settings, BarChart2,
  LogOut, ChevronDown, User, Shield, Users, Package, Lock
} from "lucide-react";
import { useCartStore } from "../store/cartStore";
import { useAuthStore, ROLES, canViewReports, canManageInventory } from "../store/authStore";
import { useOnlineStatus } from "../hooks";
import clsx from "clsx";

const ROLE_COLORS = {
  [ROLES.ADMIN]:   "bg-rose-500/20 text-rose-300 border-rose-500/30",
  [ROLES.MANAGER]: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  [ROLES.CASHIER]: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
};

const ROLE_ICONS = {
  [ROLES.ADMIN]:   Shield,
  [ROLES.MANAGER]: Users,
  [ROLES.CASHIER]: User,
};

export default function Navbar({ onOpenSettings, onOpenReports }) {
  const cartCount = useCartStore((s) => s.items.reduce((a, i) => a + i.quantity, 0));
  const { user, role, logout } = useAuthStore();
  const isOnline = useOnlineStatus();
  const [now, setNow] = React.useState(new Date());
  const [showUserMenu, setShowUserMenu] = useState(false);

  React.useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  const RoleIcon = ROLE_ICONS[role] || User;

  return (
    <header className="h-14 bg-[#0f1117]/95 backdrop-blur-md border-b border-white/[0.06] flex items-center px-4 gap-3 z-50 shrink-0 relative">
      {/* Subtle gradient line at top */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />

      {/* Brand */}
     <div className="flex items-center select-none">
  <img src={logo} alt="RetailOS" className="h-10" />
</div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Clock */}
      <div className="hidden md:flex flex-col items-center leading-tight">
        <span className="text-white/90 text-sm font-mono tabular-nums font-medium">
          {now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </span>
        <span className="text-white/30 text-[10px]">
          {now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
        </span>
      </div>

      <div className="w-px h-5 bg-white/10 hidden md:block" />

      {/* Online Status */}
      <div className={clsx(
        "flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-medium transition-all",
        isOnline
          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
          : "bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse"
      )}>
        {isOnline
          ? <Wifi size={11} className="animate-pulse" />
          : <WifiOff size={11} />}
        <span className="hidden sm:inline">{isOnline ? "Online" : "Offline"}</span>
      </div>

      {/* Cart Count */}
      {cartCount > 0 && (
        <div className="flex items-center gap-1.5 bg-indigo-500/15 text-indigo-300 border border-indigo-500/25 text-xs px-2.5 py-1 rounded-full font-medium animate-pulse">
          <ShoppingCart size={11} />
          <span>{cartCount}</span>
        </div>
      )}

      <div className="w-px h-5 bg-white/10" />

      {/* Role Badge — server-enforced, read-only */}
      <div
        className={clsx(
          "flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg border font-medium capitalize",
          ROLE_COLORS[role]
        )}
        title="Your role is set by the server and cannot be changed here"
      >
        <RoleIcon size={10} />
        {role}
        <Lock size={9} className="opacity-50 ml-0.5" />
      </div>

      {/* Reports */}
      {canViewReports(role) && (
        <button
          onClick={onOpenReports}
          className="p-2 text-white/40 hover:text-white/70 hover:bg-white/[0.06] rounded-lg transition-all duration-200"
          title="Reports"
        >
          <BarChart2 size={17} />
        </button>
      )}

      {/* User Menu */}
      <div className="relative">
        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-white/[0.06] transition-all duration-200"
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold uppercase select-none shadow-md">
            {user?.name?.[0] ?? "U"}
          </div>
          <div className="hidden lg:flex flex-col items-start">
            <span className="text-white/80 text-xs font-medium truncate max-w-[100px]">
              {user?.name ?? ""}
            </span>
            <span className={clsx(
              "text-[9px] capitalize font-medium",
              role === ROLES.ADMIN   ? "text-rose-400" :
              role === ROLES.MANAGER ? "text-amber-400" : "text-emerald-400"
            )}>
              {role}
            </span>
          </div>
          <ChevronDown size={12} className={clsx(
            "text-white/30 transition-transform duration-200",
            showUserMenu && "rotate-180"
          )} />
        </button>

        {/* Dropdown Menu */}
        {showUserMenu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
            <div className="absolute right-0 top-full mt-2 w-52 bg-[#0f1117] border border-white/[0.08] rounded-xl shadow-2xl z-50 overflow-hidden animate-in">
              {/* User Info */}
              <div className="px-4 py-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold uppercase">
                    {user?.name?.[0] ?? "U"}
                  </div>
                  <div>
                    <p className="text-white/90 text-sm font-medium">{user?.name}</p>
                    <p className="text-white/40 text-xs">{user?.email ?? ""}</p>
                  </div>
                </div>
              </div>

              {/* Role */}
              <div className="px-4 py-2 border-b border-white/[0.06]">
                <div className={clsx(
                  "flex items-center gap-2 text-xs px-2 py-1 rounded-lg border w-fit",
                  ROLE_COLORS[role]
                )}>
                  <RoleIcon size={10} />
                  <span className="capitalize font-medium">{role}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="p-2">
                {canViewReports(role) && (
                  <button
                    onClick={() => { window.location.href = "/dashboard"; setShowUserMenu(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-white/60 hover:text-white hover:bg-white/[0.06] rounded-lg text-sm transition-all"
                  >
                    <BarChart2 size={14} />
                    Dashboard & Reports
                  </button>
                )}

                {/* ── Products Management link (admin / manager) ── */}
                {canManageInventory(role) && (
                  <button
                    onClick={() => { window.location.href = "/products"; setShowUserMenu(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-white/60 hover:text-white hover:bg-white/[0.06] rounded-lg text-sm transition-all"
                  >
                    <Package size={14} />
                    Manage Products
                  </button>
                )}

                <button
                  onClick={() => { onOpenSettings?.(); setShowUserMenu(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-white/60 hover:text-white hover:bg-white/[0.06] rounded-lg text-sm transition-all"
                >
                  <Settings size={14} />
                  Settings
                </button>
                <button
                  onClick={() => { window.location.href = "/signup"; setShowUserMenu(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-white/60 hover:text-white hover:bg-white/[0.06] rounded-lg text-sm transition-all"
                >
                  <Users size={14} />
                  Add New Staff
                </button>
                <div className="h-px bg-white/[0.06] my-1.5" />
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg text-sm transition-all"
                >
                  <LogOut size={14} />
                  Sign Out
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
}