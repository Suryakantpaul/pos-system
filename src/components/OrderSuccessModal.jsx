import React, { useEffect, useRef } from "react";
import { CheckCircle2, Printer, RotateCcw, X, Receipt, Sparkles } from "lucide-react";
import { formatCurrency, formatDateTime, generateReceiptNumber } from "../utils";

const RECEIPT_NO = generateReceiptNumber();

export default function OrderSuccessModal({ order, onClose, onNewOrder }) {
  const modalRef = useRef(null);
  useEffect(() => { modalRef.current?.focus(); }, []);

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)",
      backdropFilter: "blur(10px)", zIndex: 60,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 16, fontFamily: "'DM Sans', sans-serif",
    }}>
      <div
        ref={modalRef}
        tabIndex={-1}
        className="modal-enter"
        style={{
          width: "100%", maxWidth: 380,
          background: "#0f1117", border: "1px solid rgba(255,255,255,0.09)",
          borderRadius: 22, boxShadow: "0 32px 80px rgba(0,0,0,0.7)",
          overflow: "hidden", outline: "none",
        }}
      >
        {/* Header */}
        <div style={{
          position: "relative", display: "flex", flexDirection: "column", alignItems: "center",
          padding: "32px 24px 22px",
          background: "linear-gradient(180deg, rgba(16,185,129,0.12) 0%, transparent 100%)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}>
          <button
            onClick={onClose}
            style={{
              position: "absolute", top: 14, right: 14,
              width: 28, height: 28, borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.04)", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "rgba(255,255,255,0.3)",
            }}
          >
            <X size={13} />
          </button>

          {/* Success icon */}
          <div style={{ position: "relative", marginBottom: 16 }}>
            <div style={{
              width: 68, height: 68, borderRadius: "50%",
              background: "linear-gradient(135deg, rgba(16,185,129,0.2), rgba(5,150,105,0.2))",
              border: "1px solid rgba(16,185,129,0.35)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 32px rgba(16,185,129,0.2)",
            }}>
              <CheckCircle2 size={34} color="#34d399" strokeWidth={1.5} />
            </div>
            <div style={{
              position: "absolute", top: -4, right: -4, width: 20, height: 20,
              borderRadius: "50%", background: "#f59e0b",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 12px rgba(245,158,11,0.5)",
            }}>
              <Sparkles size={10} color="#fff" />
            </div>
          </div>

          <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 20, color: "#fff", margin: "0 0 5px" }}>
            Payment Successful
          </h2>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.38)", margin: 0, textAlign: "center" }}>
            {order?.offline ? "Saved offline — will sync when back online" : "Transaction completed successfully"}
          </p>
        </div>

        {/* Receipt */}
        <div style={{ margin: "14px 16px", background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, overflow: "hidden" }}>
          {/* Receipt header */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.05)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.35)", fontSize: 11 }}>
              <Receipt size={12} />
              <span>Receipt</span>
            </div>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.2)" }}>
              {RECEIPT_NO}
            </span>
          </div>

          {/* Items */}
          {order?.items?.length > 0 && (
            <div style={{ padding: "10px 14px", maxHeight: 130, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
              {order.items.map((item, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.55)" }}>{item.name}</span>
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginLeft: 5 }}>× {item.quantity}</span>
                  </div>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.55)" }}>
                    {formatCurrency(item.lineTotal)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Totals */}
          <div style={{ padding: "10px 14px", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", gap: 7 }}>
            {order?.subtotal !== undefined && (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.33)" }}>Subtotal</span>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{formatCurrency(order.subtotal)}</span>
              </div>
            )}
            {order?.tax !== undefined && (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.33)" }}>Tax</span>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{formatCurrency(order.tax)}</span>
              </div>
            )}
            <div style={{ height: 1, background: "rgba(255,255,255,0.07)" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14, color: "#fff" }}>Total Paid</span>
              <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 500, fontSize: 17, color: "#34d399" }}>
                {formatCurrency(order?.total ?? 0)}
              </span>
            </div>
          </div>

          {/* Footer */}
          <div style={{
            padding: "8px 14px", borderTop: "1px solid rgba(255,255,255,0.04)",
            display: "flex", justifyContent: "space-between",
            background: "rgba(255,255,255,0.01)",
          }}>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "rgba(255,255,255,0.2)", letterSpacing: "0.06em" }}>
              {order?.paymentMethod?.toUpperCase() ?? "CASH"}
            </span>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "rgba(255,255,255,0.2)" }}>
              {formatDateTime(new Date())}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div style={{ padding: "0 16px 18px", display: "flex", gap: 8 }}>
          <button
            onClick={() => window.print()}
            style={{
              flex: 1, height: 42, borderRadius: 11,
              border: "1px solid rgba(255,255,255,0.09)",
              background: "rgba(255,255,255,0.04)", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
              color: "rgba(255,255,255,0.45)", fontSize: 12, fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
              transition: "all 0.14s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; e.currentTarget.style.color = "rgba(255,255,255,0.7)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "rgba(255,255,255,0.45)"; }}
          >
            <Printer size={14} />
            Print
          </button>
          <button
            onClick={onNewOrder}
            style={{
              flex: 2, height: 42, borderRadius: 11, border: "none", cursor: "pointer",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              color: "#fff", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 13,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              boxShadow: "0 4px 18px rgba(99,102,241,0.35)", transition: "all 0.14s",
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = "0.9"; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "translateY(0)"; }}
          >
            <RotateCcw size={13} />
            New Order
          </button>
        </div>
      </div>
    </div>
  );
}