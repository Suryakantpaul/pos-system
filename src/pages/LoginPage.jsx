import React, { useState, useEffect } from "react";
import { useAuthStore } from "../store/authStore";
import toast from "react-hot-toast";
import { ShoppingCart, Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTimeout(() => setMounted(true), 100);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!data.success) { toast.error(data.message || "Login failed"); return; }
      login(data.user, data.token);
      toast.success("Welcome back, " + data.user.name + "!");
      setTimeout(() => { window.location.href = "/pos"; }, 1000);
    } catch (err) {
      toast.error("Cannot connect to server");
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemo = () => { setEmail("demo@pos.com"); setPassword("123456"); };

  return (
    <div className="min-h-screen bg-[#080a0f] flex items-center justify-center p-4 relative overflow-hidden">

      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-600/15 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
        <div className="absolute top-3/4 left-1/3 w-64 h-64 bg-indigo-900/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '2s' }} />

        {/* Floating particles */}
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-indigo-400/30 rounded-full"
            style={{
              left: `${10 + (i * 8)}%`,
              top: `${20 + (i % 4) * 20}%`,
              animation: `floatParticle ${3 + (i % 3)}s ease-in-out infinite`,
              animationDelay: `${i * 0.3}s`,
            }}
          />
        ))}

        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }} />
      </div>

      <style>{`
        @keyframes floatParticle {
          0%, 100% { transform: translateY(0px) scale(1); opacity: 0.3; }
          50% { transform: translateY(-20px) scale(1.5); opacity: 0.8; }
        }
        @keyframes floatLogo {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .float-logo { animation: floatLogo 4s ease-in-out infinite; }
        .shimmer-btn {
          background: linear-gradient(90deg, #4f46e5, #7c3aed, #4338ca, #7c3aed, #4f46e5);
          background-size: 300% auto;
          animation: shimmer 4s linear infinite;
        }
        .shimmer-btn:disabled {
          animation: none;
          background: linear-gradient(90deg, #4f46e5aa, #7c3aedaa);
        }
      `}</style>

      <div className="w-full max-w-md relative z-10">

        {/* Logo */}
        <div
          className="text-center mb-8"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(-24px)',
            transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          <div className="relative inline-flex mb-5">
            <div className="float-logo w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-2xl shadow-indigo-500/40">
              <ShoppingCart size={28} className="text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-[#080a0f] animate-pulse" />
          </div>
          <h1 className="text-white text-3xl font-bold tracking-tight mb-1">RetailOS</h1>
          <p className="text-white/40 text-sm">Omnichannel Point of Sale System</p>
        </div>

        {/* Card */}
        <div
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0) scale(1)' : 'translateY(32px) scale(0.97)',
            transition: 'all 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.15s'
          }}
          className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-8 shadow-2xl"
        >
          <h2 className="text-white/90 text-lg font-semibold mb-6">Sign in to continue</h2>

          <div className="space-y-4">
            {/* Email */}
            <div style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateX(0)' : 'translateX(-16px)', transition: 'all 0.5s ease 0.3s' }}>
              <label className="text-white/50 text-xs font-medium mb-2 block uppercase tracking-wider">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin(e)}
                placeholder="your@email.com"
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-indigo-500/60 focus:bg-white/[0.06] transition-all duration-300 text-sm"
              />
            </div>

            {/* Password */}
            <div style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateX(0)' : 'translateX(-16px)', transition: 'all 0.5s ease 0.4s' }}>
              <div className="flex items-center justify-between mb-2">
                <label className="text-white/50 text-xs font-medium uppercase tracking-wider">Password</label>
                <a
                  href="/forgot-password"
                  className="text-white/30 hover:text-indigo-400 text-xs transition-colors hover:underline underline-offset-2"
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin(e)}
                  placeholder="••••••••"
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 pr-12 text-white placeholder-white/20 focus:outline-none focus:border-indigo-500/60 focus:bg-white/[0.06] transition-all duration-300 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <div style={{ opacity: mounted ? 1 : 0, transition: 'opacity 0.5s ease 0.5s' }}>
              <button
                onClick={handleLogin}
                disabled={isLoading || !email || !password}
                className="w-full shimmer-btn disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.02] active:scale-[0.98] transition-transform duration-200 group mt-2"
              >
                {isLoading ? (
                  <><Loader2 size={16} className="animate-spin" /> Signing in...</>
                ) : (
                  <>Sign In <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-200" /></>
                )}
              </button>
            </div>
          </div>

          {/* Demo credentials */}
          <div className="mt-6" style={{ opacity: mounted ? 1 : 0, transition: 'opacity 0.5s ease 0.6s' }}>
            <button
              onClick={fillDemo}
              className="w-full p-3 bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] hover:border-indigo-500/20 rounded-xl transition-all duration-300 group hover:shadow-lg hover:shadow-indigo-500/5 hover:scale-[1.01] active:scale-[0.99]"
            >
              <p className="text-white/30 text-[10px] uppercase tracking-widest mb-1 group-hover:text-indigo-400/70 transition-colors">⚡ Quick Demo Access — Click to fill</p>
              <p className="text-white/50 text-xs font-mono group-hover:text-white/70 transition-colors">demo@pos.com / 123456</p>
            </button>
          </div>
        </div>

        {/* Signup link */}
        <div className="mt-6 text-center" style={{ opacity: mounted ? 1 : 0, transition: 'opacity 0.5s ease 0.7s' }}>
          <p className="text-white/30 text-sm">
            Don't have an account?{" "}
            <a href="/signup" className="text-indigo-400 hover:text-indigo-300 transition-colors font-medium hover:underline underline-offset-2">
              Create one →
            </a>
          </p>
        </div>

        <p className="text-center text-white/10 text-xs mt-8" style={{ opacity: mounted ? 1 : 0, transition: 'opacity 0.5s ease 0.8s' }}>
          RetailOS v1.0 · Omnichannel POS System
        </p>
      </div>
    </div>
  );
}