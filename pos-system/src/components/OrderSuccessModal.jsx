/**
 * OrderSuccessModal.jsx
 * Animated success modal with order summary / receipt view.
 */

import React, { useEffect, useRef } from "react";
import { CheckCircle2, Printer, RotateCcw, X, Receipt } from "lucide-react";
import { formatCurrency, formatDateTime, generateReceiptNumber } from "../utils";

const RECEIPT_NO = generateReceiptNumber();

export default function OrderSuccessModal({ order, onClose, onNewOrder }) {
  const modalRef = useRef(null);

  // Trap focus
  useEffect(() => {
    modalRef.current?.focus();
  }, []);

  const handlePrint = () => window.print();

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        ref={modalRef}
        tabIndex={-1}
        className="w-full max-w-sm bg-[#0f1117] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden outline-none animate-[fadeInScale_0.2s_ease-out]"
        style={{ animation: "fadeInScale 0.25s cubic-bezier(0.34,1.56,0.64,1)" }}
      >
        {/* Success header */}
        <div className="relative flex flex-col items-center pt-8 pb-5 px-6 bg-gradient-to-b from-indigo-500/10 to-transparent">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 text-white/20 hover:text-white/50 hover:bg-white/[0.05] rounded-lg transition-all"
          >
            <X size={15} />
          </button>

          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400/20 to-emerald-600/20 border border-emerald-500/30 flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/10">
            <CheckCircle2 size={32} className="text-emerald-400" />
          </div>

          <h2 className="text-white font-bold text-xl font-['Syne'] mb-1">
            Payment Successful
          </h2>
          <p className="text-white/40 text-sm text-center">
            {order?.offline
              ? "Order queued — will sync when online"
              : "Transaction completed"}
          </p>
        </div>

        {/* Receipt */}
        <div className="mx-4 mb-4 bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden">
          {/* Receipt header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.05]">
            <div className="flex items-center gap-1.5 text-white/40 text-xs">
              <Receipt size={12} />
              <span>Receipt</span>
            </div>
            <span className="text-white/30 text-[10px] font-mono">{RECEIPT_NO}</span>
          </div>

          {/* Items */}
          {order?.items && (
            <div className="px-4 py-2 space-y-1.5 max-h-40 overflow-y-auto">
              {order.items.map((item, i) => (
                <div key={i} className="flex justify-between text-xs">
                  <span className="text-white/50">
                    {item.name} × {item.quantity}
                  </span>
                  <span className="text-white/60 font-mono">
                    {formatCurrency(item.lineTotal)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Totals */}
          <div className="px-4 py-3 border-t border-white/[0.05] space-y-1.5">
            {order?.subtotal !== undefined && (
              <div className="flex justify-between text-xs text-white/40">
                <span>Subtotal</span>
                <span className="font-mono">{formatCurrency(order.subtotal)}</span>
              </div>
            )}
            {order?.tax !== undefined && (
              <div className="flex justify-between text-xs text-white/40">
                <span>Tax</span>
                <span className="font-mono">{formatCurrency(order.tax)}</span>
              </div>
            )}
            <div className="flex justify-between text-white font-bold text-sm pt-1 border-t border-white/[0.06]">
              <span>Total Paid</span>
              <span className="font-mono text-emerald-400">
                {formatCurrency(order?.total ?? 0)}
              </span>
            </div>
          </div>

          {/* Date */}
          <div className="px-4 py-2 border-t border-white/[0.04] flex justify-between text-[10px] text-white/20">
            <span>{order?.paymentMethod?.toUpperCase() ?? "CASH"}</span>
            <span>{formatDateTime(new Date())}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="px-4 pb-5 flex gap-2">
          <button
            onClick={handlePrint}
            className="flex-1 h-10 flex items-center justify-center gap-2 bg-white/[0.04] hover:bg-white/[0.07] text-white/50 hover:text-white/70 rounded-xl text-sm transition-all border border-white/[0.06]"
          >
            <Printer size={14} />
            Print
          </button>
          <button
            onClick={onNewOrder}
            className="flex-1 h-10 flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
          >
            <RotateCcw size={14} />
            New Order
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.92) translateY(8px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);   }
        }
      `}</style>
    </div>
  );
}
