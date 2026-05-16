/**
 * App.jsx
 * ✅ Boot-time token validation via /auth/me — role always from backend
 * ✅ AdminRoute hard-redirects cashiers (no UI bypass possible)
 * ✅ Expired/invalid tokens auto-logout
 */

import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import POSPage            from "./pages/POSPage";
import LoginPage          from "./pages/LoginPage";
import SignupPage         from "./pages/SignupPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";

import { useAuthStore, canManageInventory, canViewReports } from "./store/authStore";

const DashboardPage = React.lazy(() => import("./pages/DashboardPage"));
const ProductsPage  = React.lazy(() => import("./pages/ProductsPage"));

const SPINNER = (
  <div className="flex items-center justify-center h-screen bg-[#0a0c10]">
    <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-indigo-500 animate-spin" />
  </div>
);

// ─── Route Guards ────────────────────────────────────────────────

/** Any logged-in user */
function ProtectedRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

/** Admin or Manager only — hard redirect, not a soft UI denial */
function InventoryRoute({ children }) {
  const { isAuthenticated, role } = useAuthStore();
  if (!isAuthenticated)            return <Navigate to="/login"  replace />;
  if (!canManageInventory(role))   return <Navigate to="/pos"    replace />;
  return children;
}

/** Admin or Manager only (reports) */
function ReportsRoute({ children }) {
  const { isAuthenticated, role } = useAuthStore();
  if (!isAuthenticated)          return <Navigate to="/login"  replace />;
  if (!canViewReports(role))     return <Navigate to="/pos"    replace />;
  return children;
}

// ─── Boot Token Validator ────────────────────────────────────────

function TokenValidator({ children }) {
  const { token, isAuthenticated, refreshUser, logout } = useAuthStore();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setChecked(true);
      return;
    }

    const BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000/api";

    fetch(`${BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("invalid");
        const data = await res.json();
        // data.user carries the real role from the DB
        const userData = data.user ?? data;
        refreshUser(userData);
      })
      .catch(() => {
        // Token expired or invalid — force re-login
        logout();
      })
      .finally(() => setChecked(true));
  }, []); // run once on mount

  if (!checked) return SPINNER;
  return children;
}

// ─── App ─────────────────────────────────────────────────────────

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#1a1d24",
            color: "#e2e8f0",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "12px",
            fontSize: "13px",
            fontFamily: "DM Sans, sans-serif",
          },
          success: { iconTheme: { primary: "#6366f1", secondary: "#0f1117" } },
          error:   { iconTheme: { primary: "#f43f5e", secondary: "#0f1117" } },
          duration: 4000,
        }}
      />

      <TokenValidator>
        <React.Suspense fallback={SPINNER}>
          <Routes>
            <Route path="/login"           element={<LoginPage />} />
            <Route path="/signup"          element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/"                element={<Navigate to="/pos" replace />} />

            {/* Any authenticated user */}
            <Route path="/pos" element={
              <ProtectedRoute><POSPage /></ProtectedRoute>
            } />

            {/* Admin / Manager only — hard redirect for cashiers */}
            <Route path="/products" element={
              <InventoryRoute><ProductsPage /></InventoryRoute>
            } />

            {/* Admin / Manager only — reports */}
            <Route path="/dashboard" element={
              <ReportsRoute><DashboardPage /></ReportsRoute>
            } />

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </React.Suspense>
      </TokenValidator>
    </BrowserRouter>
  );
}