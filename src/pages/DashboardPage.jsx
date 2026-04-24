import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BarChart2, TrendingUp, ShoppingBag, Users, DollarSign,
  ArrowLeft, RefreshCw, ArrowUpRight, ArrowDownRight, Clock,
} from "lucide-react";
import { useAuthStore, canViewReports } from "../store/authStore";
import { formatCurrency, formatDateTime } from "../utils";
import LoadingSpinner from "../components/LoadingSpinner";

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_STATS = [
  { id: "revenue",  label: "Today's Revenue",  value: 4821.50, change: 12.4, up: true,  Icon: DollarSign, color: "#6366f1", glow: "rgba(99,102,241,0.25)"  },
  { id: "orders",   label: "Orders Today",     value: 64,      change: 8.1,  up: true,  Icon: ShoppingBag, color: "#22c55e", glow: "rgba(34,197,94,0.2)"   },
  { id: "customers",label: "Customers Served", value: 51,      change: -3.2, up: false, Icon: Users,       color: "#f59e0b", glow: "rgba(245,158,11,0.2)"  },
  { id: "avg",      label: "Avg Order Value",  value: 75.33,   change: 4.8,  up: true,  Icon: TrendingUp,  color: "#8b5cf6", glow: "rgba(139,92,246,0.22)" },
];

const MOCK_ORDERS = [
  { id: "ORD-0041", time: new Date(Date.now() - 4 * 60000),  items: 3, total: 127.40, method: "card",  status: "completed" },
  { id: "ORD-0040", time: new Date(Date.now() - 17 * 60000), items: 1, total: 34.99,  method: "upi",   status: "completed" },
  { id: "ORD-0039", time: new Date(Date.now() - 28 * 60000), items: 5, total: 208.75, method: "cash",  status: "completed" },
  { id: "ORD-0038", time: new Date(Date.now() - 45 * 60000), items: 2, total: 14.48,  method: "card",  status: "refunded"  },
  { id: "ORD-0037", time: new Date(Date.now() - 63 * 60000), items: 4, total: 92.10,  method: "cash",  status: "completed" },
  { id: "ORD-0036", time: new Date(Date.now() - 87 * 60000), items: 1, total: 59.99,  method: "upi",   status: "completed" },
];

const METHOD_BADGE = {
  cash: { bg: "rgba(34,197,94,0.1)",  color: "#4ade80", label: "Cash" },
  card: { bg: "rgba(99,102,241,0.1)", color: "#a5b4fc", label: "Card" },
  upi:  { bg: "rgba(139,92,246,0.1)", color: "#c4b5fd", label: "UPI"  },
};
const STATUS_BADGE = {
  completed: { bg: "rgba(34,197,94,0.1)",  color: "#4ade80", label: "Paid"     },
  refunded:  { bg: "rgba(239,68,68,0.1)",  color: "#f87171", label: "Refunded" },
  pending:   { bg: "rgba(245,158,11,0.1)", color: "#fbbf24", label: "Pending"  },
};

function timeAgo(d) {
  const m = Math.round((Date.now() - d) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  return `${Math.round(m / 60)}h ago`;
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({ stat }) {
  const { label, value, change, up, Icon, color, glow } = stat;
  const isCurrency = ["revenue", "avg"].includes(stat.id);
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.025)",
        border: `1px solid ${hovered ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.07)"}`,
        borderRadius: 16, padding: "18px 20px",
        display: "flex", flexDirection: "column", gap: 14,
        transition: "all 0.18s", cursor: "default",
        boxShadow: hovered ? `0 8px 32px ${glow}` : "none",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.4)", letterSpacing: "0.02em" }}>{label}</span>
        <div style={{
          width: 34, height: 34, borderRadius: 10,
          background: `${color}18`, border: `1px solid ${color}30`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon size={16} color={color} />
        </div>
      </div>

      <div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontWeight: 500, fontSize: 26, color: "#fff", letterSpacing: "-0.02em" }}>
          {isCurrency ? formatCurrency(value) : value.toLocaleString()}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 5 }}>
          {up ? <ArrowUpRight size={13} color="#4ade80" /> : <ArrowDownRight size={13} color="#f87171" />}
          <span style={{ fontSize: 11, fontWeight: 600, color: up ? "#4ade80" : "#f87171" }}>
            {Math.abs(change)}%
          </span>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>vs yesterday</span>
        </div>
      </div>
    </div>
  );
}

// ─── DashboardPage ────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { role } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setRefreshing(true);
    await new Promise(r => setTimeout(r, 500));
    setStats(MOCK_STATS);
    setOrders(MOCK_ORDERS);
    setIsLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { load(); }, []);

  if (!canViewReports(role)) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        height: "100vh", background: "#080a0e", gap: 14, fontFamily: "'DM Sans', sans-serif",
      }}>
        <div style={{ fontSize: 40 }}>🔒</div>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>You don't have permission to view this page.</p>
        <Link to="/pos" style={{ fontSize: 13, color: "#818cf8", textDecoration: "none" }}>← Back to POS</Link>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#080a0e", fontFamily: "'DM Sans', sans-serif", color: "rgba(255,255,255,0.85)" }}>

      {/* Header */}
      <div style={{
        borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "16px 28px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "#0d0f14",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Link
            to="/pos"
            style={{
              width: 34, height: 34, borderRadius: 9,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.04)", display: "flex",
              alignItems: "center", justifyContent: "center",
              color: "rgba(255,255,255,0.45)", textDecoration: "none", flexShrink: 0,
            }}
          >
            <ArrowLeft size={15} />
          </Link>
          <div>
            <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, color: "#fff", margin: 0, letterSpacing: "-0.02em" }}>
              Dashboard
            </h1>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: 0 }}>
              {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          style={{
            display: "flex", alignItems: "center", gap: 7, padding: "8px 14px",
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 9, cursor: "pointer", color: "rgba(255,255,255,0.5)",
            fontSize: 12, fontFamily: "'DM Sans', sans-serif", transition: "all 0.14s",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; e.currentTarget.style.color = "rgba(255,255,255,0.8)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "rgba(255,255,255,0.5)"; }}
        >
          <RefreshCw size={13} style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }} />
          Refresh
        </button>
      </div>

      <div style={{ padding: "24px 28px", maxWidth: 1100 }}>
        {isLoading ? (
          <LoadingSpinner size="lg" label="Loading dashboard…" />
        ) : (
          <>
            {/* Stats grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14, marginBottom: 28 }}>
              {stats.map(s => <StatCard key={s.id} stat={s} />)}
            </div>

            {/* Recent Orders */}
            <div style={{
              background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 16, overflow: "hidden",
            }}>
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <Clock size={14} color="#818cf8" />
                  <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 13, color: "#fff" }}>
                    Recent Orders
                  </span>
                </div>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>Today</span>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      {["Order ID", "Time", "Items", "Total", "Method", "Status"].map(h => (
                        <th key={h} style={{
                          padding: "10px 20px", textAlign: "left",
                          fontWeight: 500, fontSize: 10, letterSpacing: "0.07em",
                          color: "rgba(255,255,255,0.3)", textTransform: "uppercase",
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order, i) => {
                      const mb = METHOD_BADGE[order.method] ?? METHOD_BADGE.cash;
                      const sb = STATUS_BADGE[order.status] ?? STATUS_BADGE.completed;
                      return (
                        <tr
                          key={order.id}
                          style={{
                            borderBottom: i < orders.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                            transition: "background 0.12s",
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.025)"}
                          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                        >
                          <td style={{ padding: "12px 20px" }}>
                            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#818cf8" }}>{order.id}</span>
                          </td>
                          <td style={{ padding: "12px 20px" }}>
                            <span style={{ color: "rgba(255,255,255,0.4)" }}>{timeAgo(order.time)}</span>
                          </td>
                          <td style={{ padding: "12px 20px" }}>
                            <span style={{ color: "rgba(255,255,255,0.55)" }}>{order.items} item{order.items !== 1 ? "s" : ""}</span>
                          </td>
                          <td style={{ padding: "12px 20px" }}>
                            <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 500, color: "rgba(255,255,255,0.8)" }}>
                              {formatCurrency(order.total)}
                            </span>
                          </td>
                          <td style={{ padding: "12px 20px" }}>
                            <span style={{
                              fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 5,
                              background: mb.bg, color: mb.color,
                            }}>{mb.label}</span>
                          </td>
                          <td style={{ padding: "12px 20px" }}>
                            <span style={{
                              fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 5,
                              background: sb.bg, color: sb.color,
                            }}>{sb.label}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}