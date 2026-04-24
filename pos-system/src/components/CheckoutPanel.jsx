/**
 * CheckoutPanel.jsx
 * Payment method selection + order finalization.
 * Handles online/offline states, loading, and success.
 */

import React, { useState, useCallback } from "react";
import {
  CreditCard, Banknote, Smartphone, X, Loader2,
  ShieldCheck, WifiOff,
} from "lucide-react";
import { useCartStore } from "../store/cartStore";
import { useOnlineStatus } from "../hooks";
import { orderApi } from "../services/api";
import { buildOrderPayload, formatCurrency, parseApiError } from "../utils";
import toast from "react-hot-toast";
import clsx from "clsx";

// ─── Payment Methods ─────────────────────────────────────────────

const PAYMENT_METHODS = [
  { id: "cash",   label: "Cash",   Icon: Banknote,    color: "emerald" },
  { id: "card",   label: "Card",   Icon: CreditCard,  color: "indigo"  },
  { id: "upi",    label: "UPI",    Icon: Smartphone,  color: "violet"  },
];

const COLOR_MAP = {
  emerald: {
    active: "bg-emerald-500/20 border-emerald-500/40 text-emerald-300",
    icon: "text-emerald-400",
  },
  indigo: {
    active: "bg-indigo-500/20 border-indigo-500/40 text-indigo-300",
    icon: "text-indigo-400",
  },
  violet: {
    active: "bg-violet-500/20 border-violet-500/40 text-violet-300",
    icon: "text-violet-400",
  },
};

// ─── CashCalculator ───────────────────────────────────────────────

function CashCalculator({ total }) {
  const [tendered, setTendered] = useState("");
  const change = tendered ? Math.max(0, parseFloat(tendered) - total) : null;
  const quickAmounts = [total, Math.ceil(total / 50) * 50, Math.ceil(total / 100) * 100];
  const unique = [...new Set(quickAmounts)].slice(0, 3);

  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 space-y-2.5">
      <p className="text-white/50 text-xs font-medium">Cash Tender</p>
      <div className="flex gap-1.5">
        {unique.map((amt) => (
          <button
            key={amt}
            onClick={() => setTendered(String(amt))}
            className="flex-1 text-xs py-1.5 bg-white/[0.04] hover:bg-white/[0.08] text-white/60 rounded-lg border border-white/[0.06] transition-all font-mono"
          >
            {formatCurrency(amt)}
          </button>
        ))}
      </div>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">$</span>
        <input
          type="number"
          min={total}
          step="0.01"
          value={tendered}
          onChange={(e) => setTendered(e.target.value)}
          placeholder={total.toFixed(2)}
          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 pl-7 py-2 text-white/80 text-sm font-mono outline-none focus:border-white/20"
        />
      </div>
      {change !== null && (
        <div className="flex justify-between items-center bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
          <span className="text-emerald-400/70 text-xs">Change</span>
          <span className="text-emerald-400 font-bold font-mono">{formatCurrency(change)}</span>
        </div>
      )}
    </div>
  );
}

// ─── CheckoutPanel ────────────────────────────────────────────────

export default function CheckoutPanel({ onClose, onSuccess }) {
  const cartState = useCartStore();
  const { items, subtotal, tax, total, discount, setCheckingOut, isCheckingOut, clearCart, setOrderSuccess } = cartState;
  const isOnline = useOnlineStatus();
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [error, setError] = useState(null);

  const grandTotal = Math.max(0, total - discount);

  const handleConfirm = useCallback(async () => {
    if (items.length === 0) return;

    setCheckingOut(true);
    setError(null);

    const payload = buildOrderPayload(cartState, paymentMethod);

    try {
      const res = await orderApi.create(payload);
      const orderId = res.data?._id ?? res.data?.id;

      setOrderSuccess(orderId);

      if (res.data?.offline) {
        toast.success("Order saved offline. Will sync when reconnected.", { icon: "📴" });
      } else {
        toast.success("Order placed successfully!");
      }

      clearCart();
      onSuccess?.({ orderId, ...payload });
    } catch (err) {
      const msg = parseApiError(err);
      setError(msg);
      toast.error(msg);
      setCheckingOut(false);
    }
  }, [cartState, paymentMethod, items.length, setCheckingOut, setOrderSuccess, clearCart, onSuccess]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#0f1117] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-indigo-400" />
            <h2 className="text-white font-semibold font-['Syne']">Checkout</h2>
          </div>
          <button
            onClick={onClose}
            disabled={isCheckingOut}
            className="p-1.5 text-white/30 hover:text-white/60 hover:bg-white/[0.05] rounded-lg transition-all"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Offline warning */}
          {!isOnline && (
            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3.5 py-2.5">
              <WifiOff size={14} className="text-amber-400 shrink-0" />
              <p className="text-amber-300 text-xs">
                You're offline. Order will be queued and synced when reconnected.
              </p>
            </div>
          )}

          {/* Summary */}
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 space-y-2">
            <p className="text-white/40 text-xs font-medium mb-3 uppercase tracking-wider">Order Summary</p>
            <div className="flex justify-between text-sm text-white/50">
              <span>{items.length} item{items.length !== 1 ? "s" : ""}</span>
              <span className="font-mono">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-white/50">
              <span>Tax</span>
              <span className="font-mono">{formatCurrency(tax)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm text-emerald-400">
                <span>Discount</span>
                <span className="font-mono">−{formatCurrency(discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-white font-bold text-lg border-t border-white/[0.08] pt-2 mt-1">
              <span className="font-['Syne']">Total</span>
              <span className="font-mono text-indigo-300">{formatCurrency(grandTotal)}</span>
            </div>
          </div>

          {/* Payment Methods */}
          <div>
            <p className="text-white/40 text-xs font-medium mb-2.5 uppercase tracking-wider">Payment Method</p>
            <div className="grid grid-cols-3 gap-2">
              {PAYMENT_METHODS.map(({ id, label, Icon, color }) => {
                const colors = COLOR_MAP[color];
                return (
                  <button
                    key={id}
                    onClick={() => setPaymentMethod(id)}
                    className={clsx(
                      "flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all",
                      paymentMethod === id
                        ? colors.active
                        : "bg-white/[0.03] border-white/[0.08] text-white/40 hover:text-white/60 hover:bg-white/[0.05]"
                    )}
                  >
                    <Icon size={18} className={paymentMethod === id ? colors.icon : undefined} />
                    <span className="text-xs font-medium">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cash calculator */}
          {paymentMethod === "cash" && <CashCalculator total={grandTotal} />}

          {/* Error */}
          {error && (
            <p className="text-rose-400 text-sm bg-rose-500/10 border border-rose-500/20 rounded-xl px-3.5 py-2.5">
              {error}
            </p>
          )}

          {/* Confirm */}
          <button
            onClick={handleConfirm}
            disabled={isCheckingOut || items.length === 0}
            className={clsx(
              "w-full h-12 rounded-xl font-semibold text-sm font-['Syne'] flex items-center justify-center gap-2 transition-all",
              isCheckingOut || items.length === 0
                ? "bg-white/[0.05] text-white/20 cursor-not-allowed"
                : "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-500/20 active:scale-[0.98]"
            )}
          >
            {isCheckingOut ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Processing…
              </>
            ) : (
              <>
                Confirm Payment · {formatCurrency(grandTotal)}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
