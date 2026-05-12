import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { ShoppingCart, ArrowLeft, Loader2, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1); // 1=email, 2=new password, 3=success
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setTimeout(() => setMounted(true), 100); }, []);

  const handleCheckEmail = async () => {
    if (!email) { toast.error("Please enter your email"); return; }
    setIsLoading(true);
    try {
      const res = await fetch("https://lid-cure-variety.ngrok-free.dev/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword: "temp" }),
      });
      const data = await res.json();
      if (!data.success && data.message === "No account found with this email") {
        toast.error("No account found with this email");
        return;
      }
      setStep(2);
      toast.success("Email verified! Set your new password.");
    } catch (err) {
      toast.error("Cannot connect to server");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword) { toast.error("Please enter a new password"); return; }
    if (newPassword.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (newPassword !== confirmPassword) { toast.error("Passwords do not match"); return; }
    setIsLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword }),
      });
      const data = await res.json();
      if (!data.success) { toast.error(data.message || "Reset failed"); return; }
      setStep(3);
    } catch (err) {
      toast.error("Cannot connect to server");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080a0f] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }} />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8" style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(-20px)', transition: 'all 0.6s ease' }}>
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-2xl shadow-indigo-500/30 mx-auto mb-4">
            <ShoppingCart size={24} className="text-white" />
          </div>
          <h1 className="text-white text-2xl font-bold">RetailOS</h1>
          <p className="text-white/40 text-sm mt-1">Reset your password</p>
        </div>

        {/* Card */}
        <div style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(24px)', transition: 'all 0.7s ease 0.15s' }}
          className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-8 shadow-2xl">

          {/* Step indicators */}
          <div className="flex items-center gap-2 mb-6">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  step > s ? 'bg-emerald-500 text-white' :
                  step === s ? 'bg-indigo-500 text-white' :
                  'bg-white/[0.06] text-white/30'
                }`}>
                  {step > s ? '✓' : s}
                </div>
                {s < 3 && <div className={`h-px w-8 transition-all duration-300 ${step > s ? 'bg-emerald-500' : 'bg-white/[0.08]'}`} />}
              </div>
            ))}
            <span className="text-white/30 text-xs ml-2">
              {step === 1 ? 'Verify Email' : step === 2 ? 'New Password' : 'Done!'}
            </span>
          </div>

          {/* Step 1 - Email */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-white/90 text-lg font-semibold mb-1">Forgot your password?</h2>
                <p className="text-white/40 text-sm">Enter your email to reset it.</p>
              </div>
              <div>
                <label className="text-white/50 text-xs font-medium mb-2 block uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCheckEmail()}
                  placeholder="your@email.com"
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-indigo-500/60 transition-all text-sm"
                />
              </div>
              <button
                onClick={handleCheckEmail}
                disabled={isLoading || !email}
                className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
              >
                {isLoading ? <><Loader2 size={16} className="animate-spin" /> Verifying...</> : 'Continue →'}
              </button>
            </div>
          )}

          {/* Step 2 - New Password */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-white/90 text-lg font-semibold mb-1">Set new password</h2>
                <p className="text-white/40 text-sm">For <span className="text-indigo-400">{email}</span></p>
              </div>
              <div>
                <label className="text-white/50 text-xs font-medium mb-2 block uppercase tracking-wider">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-indigo-500/60 transition-all text-sm"
                />
              </div>
              <div>
                <label className="text-white/50 text-xs font-medium mb-2 block uppercase tracking-wider">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleResetPassword()}
                  placeholder="Repeat password"
                  className={`w-full bg-white/[0.04] border rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none transition-all text-sm ${
                    confirmPassword && newPassword !== confirmPassword
                      ? 'border-rose-500/50 focus:border-rose-500'
                      : 'border-white/[0.08] focus:border-indigo-500/60'
                  }`}
                />
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-rose-400 text-xs mt-1">Passwords do not match</p>
                )}
              </div>
              <button
                onClick={handleResetPassword}
                disabled={isLoading || !newPassword || !confirmPassword}
                className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
              >
                {isLoading ? <><Loader2 size={16} className="animate-spin" /> Resetting...</> : 'Reset Password →'}
              </button>
            </div>
          )}

          {/* Step 3 - Success */}
          {step === 3 && (
            <div className="text-center space-y-4 py-4">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle size={32} className="text-emerald-400" />
              </div>
              <div>
                <h2 className="text-white text-xl font-bold mb-2">Password Reset!</h2>
                <p className="text-white/40 text-sm">Your password has been successfully updated.</p>
              </div>
              <button
                onClick={() => window.location.href = "/login"}
                className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold py-3 rounded-xl transition-all hover:scale-[1.02]"
              >
                Back to Login →
              </button>
            </div>
          )}
        </div>

        {/* Back to login */}
        {step !== 3 && (
          <div className="mt-6 text-center" style={{ opacity: mounted ? 1 : 0, transition: 'opacity 0.5s ease 0.7s' }}>
            <a href="/login" className="text-white/30 hover:text-white/60 text-sm transition-colors flex items-center justify-center gap-1">
              <ArrowLeft size={14} /> Back to Login
            </a>
          </div>
        )}
      </div>
    </div>
  );
}