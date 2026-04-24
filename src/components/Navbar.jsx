import React from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, Wifi, WifiOff, BarChart2, Settings, Zap } from "lucide-react";
import { useCartStore } from "../store/cartStore";
import { useAuthStore, ROLES, canViewReports } from "../store/authStore";
import { useOnlineStatus } from "../hooks";
import clsx from "clsx";

const ROLE_STYLE = {
  [ROLES.ADMIN]:   { bg: "#3b0764", text: "#e879f9", border: "#7e22ce" },
  [ROLES.MANAGER]: { bg: "#431407", text: "#fb923c", border: "#9a3412" },
  [ROLES.CASHIER]: { bg: "#052e16", text: "#4ade80", border: "#166534" },
};

export default function Navbar({ onOpenSettings }) {
  const cartCount = useCartStore((s) => s.items.reduce((a, i) => a + i.quantity, 0));
  const { user, role, switchRole } = useAuthStore();
  const isOnline = useOnlineStatus();
  const [now, setNow] = React.useState(new Date());

  React.useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const rs = ROLE_STYLE[role] ?? ROLE_STYLE[ROLES.CASHIER];

  return (
    <header style={{
      height: 56,
      background: "#0d0f14",
      borderBottom: "1px solid rgba(255,255,255,0.07)",
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      padding: "0 16px",
      gap: 10,
      flexShrink: 0,
      zIndex: 50,
      fontFamily: "'DM Sans', sans-serif",
      width: "100%",
      overflow: "hidden",
    }}>

      {/* Brand */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 10, flexShrink: 0,
          background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 0 16px rgba(99,102,241,0.35)",
        }}>
          <Zap size={16} color="#fff" />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{
            fontFamily: "'Syne', sans-serif", fontWeight: 700,
            fontSize: 15, color: "#fff", letterSpacing: "-0.02em", whiteSpace: "nowrap",
          }}>RetailOS</span>
          <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 13 }}>·</span>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.35)" }}>POS v1.0</span>
        </div>
      </div>

      {/* Flex spacer */}
      <div style={{ flex: 1 }} />

      {/* Clock */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", flexShrink: 0, lineHeight: 1.3 }}>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: "rgba(255,255,255,0.75)", letterSpacing: "0.04em" }}>
          {now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </span>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>
          {now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
        </span>
      </div>

      <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.08)", flexShrink: 0 }} />

      {/* Online status */}
      <div style={{
        display: "flex", alignItems: "center", gap: 5, flexShrink: 0,
        padding: "4px 10px", borderRadius: 99,
        background: isOnline ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
        border: `1px solid ${isOnline ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}`,
        color: isOnline ? "#4ade80" : "#f87171",
        fontSize: 11, fontWeight: 500,
      }}>
        {isOnline ? <Wifi size={11} /> : <WifiOff size={11} />}
        <span>{isOnline ? "Online" : "Offline"}</span>
      </div>

      {/* Cart badge */}
      {cartCount > 0 && (
        <div style={{
          display: "flex", alignItems: "center", gap: 5, flexShrink: 0,
          padding: "4px 10px", borderRadius: 99,
          background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)",
          color: "#818cf8", fontSize: 11, fontWeight: 600,
        }}>
          <ShoppingCart size={11} />
          <span>{cartCount}</span>
        </div>
      )}

      <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.08)", flexShrink: 0 }} />

      {/* Role switcher */}
      <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
        {Object.values(ROLES).map((r) => (
          <button
            key={r}
            onClick={() => switchRole(r)}
            style={{
              fontSize: 10, padding: "3px 8px", borderRadius: 6, border: "1px solid",
              fontWeight: 600, cursor: "pointer", textTransform: "capitalize",
              transition: "all 0.15s", whiteSpace: "nowrap", fontFamily: "'DM Sans', sans-serif",
              background: role === r ? ROLE_STYLE[r]?.bg : "rgba(255,255,255,0.04)",
              color: role === r ? ROLE_STYLE[r]?.text : "rgba(255,255,255,0.3)",
              borderColor: role === r ? ROLE_STYLE[r]?.border : "rgba(255,255,255,0.08)",
            }}
          >
            {r}
          </button>
        ))}
      </div>

      {/* Reports */}
      {canViewReports(role) && (
        <Link
          to="/dashboard"
          title="Dashboard"
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: 32, height: 32, borderRadius: 8, flexShrink: 0,
            color: "rgba(255,255,255,0.4)", background: "transparent",
            border: "none", cursor: "pointer", textDecoration: "none",
            transition: "all 0.15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "rgba(255,255,255,0.8)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.4)"; }}
        >
          <BarChart2 size={17} />
        </Link>
      )}

      {/* Settings */}
      <button
        onClick={onOpenSettings}
        title="Settings"
        style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          width: 32, height: 32, borderRadius: 8, flexShrink: 0,
          color: "rgba(255,255,255,0.4)", background: "transparent",
          border: "none", cursor: "pointer", transition: "all 0.15s",
        }}
        onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "rgba(255,255,255,0.8)"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.4)"; }}
      >
        <Settings size={17} />
      </button>

      {/* User */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, paddingLeft: 4 }}>
        <div style={{
          width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
          background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, fontWeight: 700, color: "#fff", textTransform: "uppercase",
        }}>
          {user?.name?.[0] ?? "U"}
        </div>
        <span style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {user?.name ?? "Demo User"}
        </span>
        <div style={{
          fontSize: 9, padding: "2px 7px", borderRadius: 4, fontWeight: 700,
          background: rs.bg, color: rs.text, border: `1px solid ${rs.border}`,
          textTransform: "uppercase", letterSpacing: "0.06em",
        }}>
          {role ?? "cashier"}
        </div>
      </div>
    </header>
  );
}