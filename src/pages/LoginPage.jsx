import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Zap, Loader2, AlertCircle, Mail, Lock } from "lucide-react";
import { authApi } from "../services/api";
import { useAuthStore } from "../store/authStore";

export default function LoginPage() {
  const navigate   = useNavigate();
  const { login, isAuthenticated } = useAuthStore();

  const [form, setForm]       = useState({ email: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]  = useState(false);
  const [error, setError]      = useState("");

  // If already logged in, go straight to POS
  useEffect(() => {
    if (isAuthenticated) navigate("/pos", { replace: true });
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError("Please enter your email and password");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await authApi.login({ email: form.email, password: form.password });
      const { token, user } = res.data;
      login(user, token);           // saves to zustand + localStorage
      navigate("/pos", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message ?? "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role) => {
    const demos = {
      admin:   { email: "demo@pos.com",    password: "123456" },
      manager: { email: "manager@pos.com", password: "123456" },
      cashier: { email: "cashier@pos.com", password: "123456" },
    };
    setForm(demos[role]);
    setError("");
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#080a0e",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
      fontFamily: "'DM Sans', sans-serif",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Background glow blobs */}
      <div style={{
        position: "absolute", top: "-20%", left: "50%", transform: "translateX(-50%)",
        width: 600, height: 600, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: "-10%", left: "10%",
        width: 400, height: 400, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div style={{ width: "100%", maxWidth: 420, position: "relative", zIndex: 1 }}>

        {/* Logo */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 36 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 16,
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 32px rgba(99,102,241,0.4)",
            marginBottom: 14,
          }}>
            <Zap size={26} color="#fff" />
          </div>
          <h1 style={{
            fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 26,
            color: "#fff", letterSpacing: "-0.03em", margin: "0 0 6px",
          }}>
            RetailOS
          </h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.38)", margin: 0 }}>
            Sign in to your account
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: "#0f1117",
          border: "1px solid rgba(255,255,255,0.09)",
          borderRadius: 20,
          padding: "28px 28px 24px",
          boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
        }}>

          {/* Error */}
          {error && (
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)",
              borderRadius: 10, padding: "10px 14px", marginBottom: 20,
              color: "#f87171", fontSize: 13,
            }}>
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Email */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.45)", letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: 7 }}>
                Email
              </label>
              <div style={{ position: "relative" }}>
                <Mail size={15} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.25)", pointerEvents: "none" }} />
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                  style={{
                    width: "100%", height: 44, borderRadius: 10, boxSizing: "border-box",
                    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)",
                    color: "rgba(255,255,255,0.85)", fontSize: 13, padding: "0 14px 0 40px",
                    fontFamily: "'DM Sans', sans-serif", outline: "none", transition: "all 0.15s",
                  }}
                  onFocus={e => { e.target.style.borderColor = "rgba(99,102,241,0.5)"; e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.12)"; }}
                  onBlur={e  => { e.target.style.borderColor = "rgba(255,255,255,0.09)"; e.target.style.boxShadow = "none"; }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.45)", letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: 7 }}>
                Password
              </label>
              <div style={{ position: "relative" }}>
                <Lock size={15} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.25)", pointerEvents: "none" }} />
                <input
                  name="password"
                  type={showPass ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  required
                  style={{
                    width: "100%", height: 44, borderRadius: 10, boxSizing: "border-box",
                    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)",
                    color: "rgba(255,255,255,0.85)", fontSize: 13, padding: "0 40px 0 40px",
                    fontFamily: "'DM Sans', sans-serif", outline: "none", transition: "all 0.15s",
                  }}
                  onFocus={e => { e.target.style.borderColor = "rgba(99,102,241,0.5)"; e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.12)"; }}
                  onBlur={e  => { e.target.style.borderColor = "rgba(255,255,255,0.09)"; e.target.style.boxShadow = "none"; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  tabIndex={-1}
                  style={{
                    position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer",
                    color: "rgba(255,255,255,0.25)", padding: 2, display: "flex",
                  }}
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%", height: 46, borderRadius: 12, border: "none",
                background: loading ? "rgba(99,102,241,0.4)" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                color: "#fff", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14,
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                boxShadow: loading ? "none" : "0 4px 20px rgba(99,102,241,0.35)",
                transition: "all 0.15s", marginTop: 4, letterSpacing: "0.01em",
              }}
              onMouseEnter={e => { if (!loading) { e.currentTarget.style.opacity = "0.9"; e.currentTarget.style.transform = "translateY(-1px)"; } }}
              onMouseLeave={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "translateY(0)"; }}
            >
              {loading ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Signing in…</> : "Sign In"}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0" }}>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>or try a demo account</span>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
          </div>

          {/* Demo buttons */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {[
              { role: "admin",   label: "Admin",   color: "#e879f9", bg: "rgba(168,85,247,0.1)",  border: "rgba(168,85,247,0.25)" },
              { role: "manager", label: "Manager", color: "#fb923c", bg: "rgba(251,146,60,0.1)",  border: "rgba(251,146,60,0.25)" },
              { role: "cashier", label: "Cashier", color: "#4ade80", bg: "rgba(74,222,128,0.1)",  border: "rgba(74,222,128,0.25)" },
            ].map(({ role, label, color, bg, border }) => (
              <button
                key={role}
                type="button"
                onClick={() => fillDemo(role)}
                style={{
                  padding: "8px 0", borderRadius: 9, cursor: "pointer",
                  background: bg, border: `1px solid ${border}`,
                  color, fontSize: 11, fontWeight: 600,
                  fontFamily: "'DM Sans', sans-serif", transition: "all 0.12s",
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = "0.8"}
                onMouseLeave={e => e.currentTarget.style.opacity = "1"}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Sign up link */}
        <p style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "rgba(255,255,255,0.3)" }}>
          Don't have an account?{" "}
          <Link
            to="/register"
            style={{ color: "#818cf8", textDecoration: "none", fontWeight: 600 }}
            onMouseEnter={e => e.currentTarget.style.color = "#a5b4fc"}
            onMouseLeave={e => e.currentTarget.style.color = "#818cf8"}
          >
            Create one
          </Link>
        </p>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
