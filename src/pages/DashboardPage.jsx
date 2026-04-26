/**
 * DashboardPage.jsx
 * Admin / Manager dashboard — sales overview, recent orders.
 * Role-gated: admin + manager only.
 */

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  TrendingUp, ShoppingBag, Package, Users,
  ArrowLeft, RefreshCw, BarChart2,
} from "lucide-react";
import { useAuthStore, canViewReports } from "../store/authStore";
import { formatCurrency, formatDateTime } from "../utils";
import { orderApi } from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";

// ─── Stat Card ───────────────────────────────────────────────────

function StatCard({ label, value, delta, Icon, color }) {
  const colors = {
    indigo: "from-indigo-500/20 to-indigo-600/5 border-indigo-500/20 text-indigo-400",
    emerald: "from-emerald-500/20 to-emerald-600/5 border-emerald-500/20 text-emerald-400",
    amber: "from-amber-500/20 to-amber-600/5 border-amber-500/20 text-amber-400",
    violet: "from-violet-500/20 to-violet-600/5 border-violet-500/20 text-violet-400",
  };

  return (
    <div className={`bg-gradient-to-br ${colors[color]} border rounded-2xl p-5`}>
      <div className="flex items-start justify-between mb-4">
        <p className="text-white/50 text-sm">{label}</p>
        <div className={`p-2 rounded-xl bg-white/[0.04]`}>
          <Icon size={16} />
        </div>
      </div>
      <p className="text-white text-2xl font-bold font-['Syne'] tabular-nums">{value}</p>
      {delta && (
        <p className="text-white/40 text-xs mt-1">
          <span className={delta.startsWith("+") ? "text-emerald-400" : "text-rose-400"}>
            {delta}
          </span>
          {" "}vs yesterday
        </p>
      )}
    </div>
  );
}

// ─── DashboardPage ───────────────────────────────────────────────

export default function DashboardPage() {
  const { role } = useAuthStore();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        // const res = await orderApi.list({ limit: 10 });
        // Mock data:
        await new Promise((r) => setTimeout(r, 500));
        setOrders([
          { _id: "o1", total: 128.45, paymentMethod: "card",  createdAt: new Date(), items: [{name:"Earbuds",quantity:1},{name:"Green Tea",quantity:3}] },
          { _id: "o2", total: 34.99,  paymentMethod: "cash",  createdAt: new Date(Date.now()-120000), items: [{name:"USB Hub",quantity:1}] },
          { _id: "o3", total: 17.46,  paymentMethod: "upi",   createdAt: new Date(Date.now()-300000), items: [{name:"Notebook",quantity:2},{name:"Pen Set",quantity:1}] },
          { _id: "o4", total: 59.97,  paymentMethod: "cash",  createdAt: new Date(Date.now()-600000), items: [{name:"Speaker",quantity:1}] },
        ]);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  if (!canViewReports(role)) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#0a0c10] text-white/30 gap-4">
        <BarChart2 size={40} strokeWidth={1} />
        <p>You don't have permission to view this page.</p>
        <Link to="/pos" className="text-indigo-400 text-sm hover:underline">← Back to POS</Link>
      </div>
    );
  }

  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);

  return (
    <div className="min-h-screen bg-[#0a0c10] text-white font-['DM_Sans'] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold font-['Syne']">Dashboard</h1>
          <p className="text-white/40 text-sm">Today's overview</p>
        </div>
        <Link
          to="/pos"
          className="flex items-center gap-2 px-4 py-2 bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] text-white/60 hover:text-white/80 rounded-xl text-sm transition-all"
        >
          <ArrowLeft size={14} />
          POS Terminal
        </Link>
      </div>

      {isLoading ? (
        <LoadingSpinner size="lg" label="Loading dashboard…" className="mt-20" />
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard label="Revenue Today" value={formatCurrency(totalRevenue)} delta="+12.4%" Icon={TrendingUp} color="indigo" />
            <StatCard label="Orders" value={orders.length} delta="+3" Icon={ShoppingBag} color="emerald" />
            <StatCard label="Items Sold" value={orders.reduce((s,o)=>s+o.items.reduce((a,i)=>a+i.quantity,0),0)} delta="+8" Icon={Package} color="amber" />
            <StatCard label="Customers" value={orders.length} delta="+2" Icon={Users} color="violet" />
          </div>

          {/* Recent Orders */}
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
              <h2 className="font-semibold font-['Syne'] text-sm">Recent Orders</h2>
              <button className="p-1.5 text-white/20 hover:text-white/50 hover:bg-white/[0.04] rounded-lg transition-all">
                <RefreshCw size={14} />
              </button>
            </div>

            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.04]">
                  {["Order ID", "Items", "Method", "Total", "Time"].map((h) => (
                    <th key={h} className="text-left px-5 py-2.5 text-white/30 text-xs font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order._id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3 text-white/50 font-mono text-xs">{order._id}</td>
                    <td className="px-5 py-3 text-white/60 text-xs truncate max-w-[180px]">
                      {order.items.map((i) => `${i.name} ×${i.quantity}`).join(", ")}
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-[10px] bg-white/[0.06] text-white/40 px-2 py-0.5 rounded-full capitalize">{order.paymentMethod}</span>
                    </td>
                    <td className="px-5 py-3 font-mono text-indigo-300 font-medium">{formatCurrency(order.total)}</td>
                    <td className="px-5 py-3 text-white/30 text-xs">{formatDateTime(order.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
