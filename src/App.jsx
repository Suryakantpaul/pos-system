/**
 * App.jsx
 * Root application with routing and global providers
 */

import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import POSPage from "./pages/POSPage";

// Lazy-load heavier pages
const DashboardPage = React.lazy(() => import("./pages/DashboardPage"));

export default function App() {
  return (
    <BrowserRouter>
      {/* Toast notifications */}
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
          success: {
            iconTheme: { primary: "#6366f1", secondary: "#0f1117" },
          },
          error: {
            iconTheme: { primary: "#f43f5e", secondary: "#0f1117" },
          },
          duration: 4000,
        }}
      />

      <React.Suspense
        fallback={
          <div className="flex items-center justify-center h-screen bg-[#0a0c10]">
            <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-indigo-500 animate-spin" />
          </div>
        }
      >
        <Routes>
          <Route path="/" element={<Navigate to="/pos" replace />} />
          <Route path="/pos" element={<POSPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="*" element={<Navigate to="/pos" replace />} />
        </Routes>
      </React.Suspense>
    </BrowserRouter>
  );
}
