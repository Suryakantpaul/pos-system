import React, { useState, useCallback } from "react";
import { CreditCard, Banknote, Smartphone, X, Loader2, ShieldCheck, WifiOff } from "lucide-react";
import { useCartStore } from "../store/cartStore";
import { useOnlineStatus } from "../hooks";
import { orderApi } from "../services/api";
import { buildOrderPayload, formatCurrency, parseApiError } from "../utils";
import toast from "react-hot-toast";

const METHODS = [
  { id: "cash", label: "Cash",   Icon: Banknote,   grad: "linear-gradient(135deg,#064e3b,#065f46)", accent: "#4ade80", border: "rgba(34,197,94,0.3)" },
  { id: "card", label: "Card",   Icon: CreditCard, grad: "linear-gradient(135deg,#1e1b4b,#312e81)", accent: "#a5b4fc", border: "rgba(99,102,241,0.35)" },
  { id: "upi",  label: "UPI",    Icon: Smartphone, grad: "linear-gradient(135deg,#2e1065,#4c1d95)", accent: "#c4b5fd", border: "rgba(139,92,246,0.35)" },
];

function CashCalc({ total }) {
  const [tendered, setTendered] = useState("");
  const change = tendered ? Math.max(0, parseFloat(tendered) - total) : null;
  const amounts = [...new Set([total, Math.ceil(total / 50) * 50, Math.ceil(total / 100) * 100])].slice(0, 3);

  return (
    <div style={{
      background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 12, padding: 14, display: "flex", flexDirection: "column", gap: 10,
    }}>
      <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
        Cash Tender
      </p>
      <div style={{ display: "flex", gap: 6 }}>
        {amounts.map(amt => (
          <button key={amt} onClick={() => setTendered(String(amt))} style={{
            flex: 1, padding: "7px 0", borderRadius: 8, cursor: "pointer",
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
            color: "rgba(255,255,255,0.6)", fontSize: 11,
            fontFamily: "'DM Mono', monospace", transition: "all 0.12s",
          }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "#fff"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "rgba(255,255,255,0.6)"; }}
          >
            {formatCurrency(amt)}
          </button>
        ))}
      </div>
      <div style={{ position: "relative" }}>
        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)", fontSize: 13 }}>$</span>
        <input
          type="number" min={total} step="0.01" value={tendered}
          onChange={e => setTendered(e.target.value)}
          placeholder={total.toFixed(2)}
          style={{
            width: "100%", padding: "9px 12px 9px 28px", borderRadius: 8, boxSizing: "border-box",
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
            color: "rgba(255,255,255,0.85)", fontSize: 13,
            fontFamily: "'DM Mono', monospace", outline: "none",
          }}
        />
      </div>
      {change !== null && (
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)",
          borderRadius: 8, padding: "8px 12px",
        }}>
          <span style={{ fontSize: 11, color: "rgba(74,222,128,0.7)" }}>Change due</span>
          <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 600, fontSize: 15, color: "#4ade80" }}>
            {formatCurrency(change)}
          </span>
        </div>
      )}
    </div>
  );
}

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
      if (res.data?.offline) toast.success("Order saved offline — will sync when reconnected.", { icon: "📴" });
      else toast.success("Order placed successfully!");
      clearCart();
      onSuccess?.({ orderId, ...payload });
    } catch (err) {
      const msg = parseApiError(err);
      setError(msg);
      toast.error(msg);
      setCheckingOut(false);
    }
  }, [cartState, paymentMethod, items.length]);

  const selected = METHODS.find(m => m.id === paymentMethod);

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
      backdropFilter: "blur(8px)", zIndex: 50,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div className="modal-enter" style={{
        width: "100%", maxWidth: 420,
        background: "#0f1117", border: "1px solid rgba(255,255,255,0.09)",
        borderRadius: 20, boxShadow: "0 24px 64px rgba(0,0,0,0.6)", overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 9,
              background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <ShieldCheck size={16} color="#818cf8" />
            </div>
            <div>
              <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15, color: "#fff", margin: 0 }}>Checkout</h2>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", margin: 0 }}>{items.length} item{items.length !== 1 ? "s" : ""} · Secure</p>
            </div>
          </div>
          <button onClick={onClose} disabled={isCheckingOut} style={{
            width: 30, height: 30, borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.04)", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "rgba(255,255,255,0.4)",
          }}>
            <X size={14} />
          </button>
        </div>

        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Offline warning */}
          {!isOnline && (
            <div style={{
              display: "flex", alignItems: "center", gap: 8, padding: "10px 14px",
              background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)",
              borderRadius: 10, color: "#fbbf24", fontSize: 12,
            }}>
              <WifiOff size={14} />
              <span>Offline — order will sync when reconnected</span>
            </div>
          )}

          {/* Order summary */}
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 14 }}>
            <p style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>
              Order Summary
            </p>
            {[
              { label: `${items.length} item${items.length !== 1 ? "s" : ""}`, value: formatCurrency(subtotal) },
              { label: "Tax", value: formatCurrency(tax) },
              ...(discount > 0 ? [{ label: "Discount", value: `−${formatCurrency(discount)}`, green: true }] : []),
            ].map(({ label, value, green }) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{label}</span>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: green ? "#4ade80" : "rgba(255,255,255,0.5)" }}>{value}</span>
              </div>
            ))}
            <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "10px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15, color: "#fff" }}>Total</span>
              <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 500, fontSize: 20, color: "#a5b4fc" }}>{formatCurrency(grandTotal)}</span>
            </div>
          </div>

          {/* Payment methods */}
          <div>
            <p style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
              Payment Method
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {METHODS.map(({ id, label, Icon, grad, accent, border }) => {
                const active = paymentMethod === id;
                return (
                  <button
                    key={id}
                    onClick={() => setPaymentMethod(id)}
                    style={{
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 7,
                      padding: "14px 8px", borderRadius: 12, cursor: "pointer",
                      border: `1px solid ${active ? border : "rgba(255,255,255,0.08)"}`,
                      background: active ? grad : "rgba(255,255,255,0.03)",
                      color: active ? accent : "rgba(255,255,255,0.4)",
                      transition: "all 0.18s", transform: active ? "scale(1.03)" : "scale(1)",
                      boxShadow: active ? `0 4px 16px rgba(0,0,0,0.3)` : "none",
                    }}
                  >
                    <Icon size={18} />
                    <span style={{ fontSize: 11, fontWeight: 600 }}>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cash calculator */}
          {paymentMethod === "cash" && <CashCalc total={grandTotal} />}

          {/* Error */}
          {error && (
            <p style={{
              fontSize: 12, color: "#f87171", background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.25)", borderRadius: 10, padding: "10px 14px",
            }}>
              {error}
            </p>
          )}

          {/* Confirm */}
          <button
            onClick={handleConfirm}
            disabled={isCheckingOut || items.length === 0}
            style={{
              width: "100%", height: 48, borderRadius: 12, border: "none",
              cursor: isCheckingOut ? "not-allowed" : "pointer",
              background: isCheckingOut || items.length === 0
                ? "rgba(255,255,255,0.07)"
                : selected?.grad ?? "linear-gradient(135deg,#6366f1,#8b5cf6)",
              color: isCheckingOut || items.length === 0 ? "rgba(255,255,255,0.2)" : "#fff",
              fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              boxShadow: isCheckingOut ? "none" : "0 4px 20px rgba(99,102,241,0.3)",
              transition: "all 0.18s", letterSpacing: "0.01em",
            }}
          >
            {isCheckingOut ? (
              <><Loader2 size={16} className="animate-spin" /> Processing…</>
            ) : (
              `Confirm Payment · ${formatCurrency(grandTotal)}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}