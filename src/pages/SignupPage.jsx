import React, { useState } from "react";
import { useAuthStore } from "../store/authStore";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

export default function SignupPage() {
  const login = useAuthStore((s) => s.login);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("cashier");
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch("https://lid-cure-variety.ngrok-free.dev/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await res.json();

      if (!data.success) {
        toast.error(data.message || "Signup failed");
        return;
      }

      login(data.user, data.token);
      toast.success("Welcome, " + data.user.name + " 🚀");
      setTimeout(() => {
        window.location.href = "/pos";
      }, 1000);
    } catch (err) {
      toast.error("Cannot connect to server");
    } finally {
      setIsLoading(false);
    }
  };

  const container = {
    hidden: { opacity: 0, y: 40 },
    show: {
      opacity: 1,
      y: 0,
      transition: { staggerChildren: 0.1 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden">

      {/* Animated Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-black to-purple-900 animate-pulse opacity-40"></div>

      {/* Floating Neon Orbs */}
      <motion.div
        className="absolute w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl"
        animate={{ x: [0, 100, -100, 0], y: [0, -80, 80, 0] }}
        transition={{ duration: 15, repeat: Infinity }}
      />
      <motion.div
        className="absolute w-72 h-72 bg-purple-500/20 rounded-full blur-3xl"
        animate={{ x: [0, -80, 80, 0], y: [0, 100, -100, 0] }}
        transition={{ duration: 18, repeat: Infinity }}
      />

      {/* Main Card */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative w-full max-w-md bg-white/5 backdrop-blur-3xl border border-white/10 shadow-2xl rounded-3xl p-10 z-10"
      >
        {/* Logo */}
        <motion.div variants={item} className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
            <span className="text-white text-2xl font-bold">R</span>
          </div>
          <h1 className="text-white text-3xl font-bold tracking-wide">
            Join RetailOS
          </h1>
          <p className="text-white/50 text-sm mt-2">
            Build the future of retail
          </p>
        </motion.div>

        {/* Form */}
        <form onSubmit={handleSignup} className="space-y-6">

          {[
            { label: "Full Name", type: "text", value: name, setter: setName, placeholder: "John Doe" },
            { label: "Email", type: "email", value: email, setter: setEmail, placeholder: "john@store.com" },
            { label: "Password", type: "password", value: password, setter: setPassword, placeholder: "••••••••" },
          ].map((field, i) => (
            <motion.div variants={item} key={i}>
              <label className="text-white/60 text-sm block mb-2">
                {field.label}
              </label>
              <input
                type={field.type}
                value={field.value}
                required
                disabled={isLoading}
                onChange={(e) => field.setter(e.target.value)}
                placeholder={field.placeholder}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 transition-all"
              />
            </motion.div>
          ))}

          <motion.div variants={item}>
            <label className="text-white/60 text-sm block mb-2">
              Role
            </label>
            <select
              value={role}
              disabled={isLoading}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 transition-all"
            >
              <option value="cashier" className="bg-black">Cashier</option>
              <option value="manager" className="bg-black">Manager</option>
              <option value="admin" className="bg-black">Admin</option>
            </select>
          </motion.div>

          {/* Animated Button */}
          <motion.button
            variants={item}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 shadow-lg hover:shadow-indigo-500/50 transition-all disabled:opacity-50"
          >
            {isLoading ? "Creating Account..." : "Create Account"}
          </motion.button>
        </form>

        {/* Login Link */}
        <motion.div variants={item} className="mt-8 text-center">
          <p className="text-white/40 text-sm">
            Already have an account?{" "}
            <a
              href="/login"
              className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
            >
              Sign in
            </a>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}