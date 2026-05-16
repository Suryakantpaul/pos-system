/**
 * CheckoutPanel.jsx
 * ✅ Fixed: checkout button stuck (setCheckingOut never reset on success)
 * ✅ Added: Invoice PDF download on successful checkout
 * ✅ Fixed: currency now uses INR (₹)
 */

import React, { useState, useCallback } from "react";
import {
  CreditCard, Banknote, Smartphone, X, Loader2,
  ShieldCheck, WifiOff, FileDown,
} from "lucide-react";
import { useCartStore } from "../store/cartStore";
import { useOnlineStatus } from "../hooks";
import { orderApi } from "../services/api";
import { buildOrderPayload, formatCurrency, parseApiError, generateReceiptNumber, formatDateTime } from "../utils";
import toast from "react-hot-toast";
import clsx from "clsx";

// ─── Payment Methods ─────────────────────────────────────────────

const PAYMENT_METHODS = [
  { id: "cash",   label: "Cash",   Icon: Banknote,    color: "emerald" },
  { id: "card",   label: "Card",   Icon: CreditCard,  color: "indigo"  },
  { id: "upi",    label: "UPI",    Icon: Smartphone,  color: "violet"  },
];

const COLOR_MAP = {
  emerald: { active: "bg-emerald-500/20 border-emerald-500/40 text-emerald-300", icon: "text-emerald-400" },
  indigo:  { active: "bg-indigo-500/20 border-indigo-500/40 text-indigo-300",   icon: "text-indigo-400"  },
  violet:  { active: "bg-violet-500/20 border-violet-500/40 text-violet-300",   icon: "text-violet-400"  },
};

// ─── formatINR ────────────────────────────────────────────────────

const formatINR = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(Number(n) || 0);

// ─── Invoice PDF Generator ────────────────────────────────────────

function generateInvoicePDF(order, receiptNo) {
  const { items = [], subtotal = 0, tax = 0, discount = 0, total = 0, paymentMethod = "cash", createdAt } = order;
  const storeName  = localStorage.getItem("pos-store-name")  || "RetailOS Store";
  const storeAddr  = localStorage.getItem("pos-store-addr")  || "";
  const storePhone = localStorage.getItem("pos-store-phone") || "";
  const dateStr = formatDateTime(createdAt || new Date());

  const rows = items.map((item) => `
    <tr>
      <td style="padding:7px 10px;border-bottom:1px solid #e9eef5;">${item.name}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #e9eef5;text-align:center;">${item.quantity}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #e9eef5;text-align:right;">₹${Number(item.price).toFixed(2)}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #e9eef5;text-align:right;">₹${Number(item.lineTotal ?? item.price * item.quantity).toFixed(2)}</td>
    </tr>`).join("");

  const printWin = window.open("", "_blank", "width=680,height=900");
  if (!printWin) { toast.error("Allow pop-ups to download the invoice."); return; }

  printWin.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>Invoice ${receiptNo}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Segoe UI',Arial,sans-serif;font-size:13px;color:#1e293b;background:#fff;padding:36px}
    .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px}
    .brand{font-size:24px;font-weight:900;color:#4f46e5;letter-spacing:-1px}.brand span{color:#7c3aed}
    .store-info{font-size:12px;color:#64748b;line-height:1.7;margin-top:6px}
    .inv-meta{text-align:right}
    .lbl{font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;margin-top:8px}
    .val{font-size:13px;font-weight:700;color:#1e293b}
    .rcpt{font-size:16px;font-weight:800;color:#4f46e5}
    hr{border:none;border-top:2px solid #e2e8f0;margin:22px 0}
    table{width:100%;border-collapse:collapse}
    thead tr{background:#4f46e5;color:#fff}
    thead th{padding:10px 10px;text-align:left;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.5px}
    thead th:nth-child(2){text-align:center}
    thead th:nth-child(3),thead th:nth-child(4){text-align:right}
    tbody tr:nth-child(even){background:#f8fafc}
    tbody td{font-size:13px;color:#334155}
    .totals{margin-top:22px;display:flex;justify-content:flex-end}
    .tbox{width:260px}
    .trow{display:flex;justify-content:space-between;padding:5px 0;font-size:13px;color:#64748b}
    .trow.grand{padding-top:12px;border-top:2px solid #4f46e5;font-size:17px;font-weight:900;color:#4f46e5}
    .badge{display:inline-block;margin-top:22px;background:#f0fdf4;border:1px solid #86efac;color:#15803d;padding:6px 16px;border-radius:999px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px}
    .footer{margin-top:38px;text-align:center;font-size:11px;color:#94a3b8;line-height:1.8}
    .btn{display:block;margin:28px auto 0;background:#4f46e5;color:#fff;border:none;padding:12px 36px;border-radius:10px;font-size:14px;cursor:pointer;font-weight:700;letter-spacing:.2px}
    @media print{.btn{display:none!important}body{padding:16px}}
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">Retail<span>OS</span></div>
      <div class="store-info">
        <strong>${storeName}</strong><br/>
        ${storeAddr ? storeAddr + "<br/>" : ""}
        ${storePhone ? "📞 " + storePhone : ""}
      </div>
    </div>
    <div class="inv-meta">
      <div class="lbl">Invoice No.</div>
      <div class="rcpt">${receiptNo}</div>
      <div class="lbl">Date &amp; Time</div>
      <div class="val">${dateStr}</div>
      <div class="lbl">Payment Method</div>
      <div class="val">${(paymentMethod || "cash").toUpperCase()}</div>
    </div>
  </div>
  <hr/>
  <table>
    <thead>
      <tr>
        <th>Product</th><th>Qty</th><th>Unit Price</th><th>Total</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="totals">
    <div class="tbox">
      <div class="trow"><span>Subtotal</span><span>₹${Number(subtotal).toFixed(2)}</span></div>
      <div class="trow"><span>Tax (8%)</span><span>₹${Number(tax).toFixed(2)}</span></div>
      ${discount > 0 ? `<div class="trow"><span>Discount</span><span>−₹${Number(discount).toFixed(2)}</span></div>` : ""}
      <div class="trow grand"><span>Total Paid</span><span>₹${Number(total).toFixed(2)}</span></div>
    </div>
  </div>
  <div><span class="badge">✓ Paid via ${(paymentMethod || "cash").toUpperCase()}</span></div>
  <div class="footer">
    Thank you for shopping at ${storeName}!<br/>
    This is a computer-generated invoice and does not require a signature.
  </div>
  <button class="btn" onclick="window.print()">🖨️ Print / Save as PDF</button>
</body>
</html>`);

  printWin.document.close();
  printWin.focus();
  setTimeout(() => { try { printWin.print(); } catch (_) {} }, 600);
}

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
          <button key={amt} onClick={() => setTendered(String(amt))}
            className="flex-1 text-xs py-1.5 bg-white/[0.04] hover:bg-white/[0.08] text-white/60 rounded-lg border border-white/[0.06] transition-all font-mono">
            {formatINR(amt)}
          </button>
        ))}
      </div>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">₹</span>
        <input type="number" min={total} step="0.01" value={tendered}
          onChange={(e) => setTendered(e.target.value)} placeholder={total.toFixed(2)}
          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 pl-7 py-2 text-white/80 text-sm font-mono outline-none focus:border-white/20" />
      </div>
      {change !== null && (
        <div className="flex justify-between items-center bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
          <span className="text-emerald-400/70 text-xs">Change</span>
          <span className="text-emerald-400 font-bold font-mono">₹{change.toFixed(2)}</span>
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
    const receiptNo = generateReceiptNumber();

    try {
      const res = await orderApi.create(payload);
      const orderId = res.data?._id ?? res.data?.id;

      // ✅ Reset checkout loading state
      setOrderSuccess(orderId);   // internally sets isCheckingOut → false
      setCheckingOut(false);

      if (res.data?.offline) {
        toast.success("Order saved offline. Will sync when reconnected.", { icon: "📴" });
      } else {
        toast.success("Order placed successfully!");
      }

      clearCart();

      // ✅ Auto-generate Invoice PDF
      generateInvoicePDF({ ...payload, total: grandTotal }, receiptNo);

      onSuccess?.({ orderId, receiptNo, ...payload, total: grandTotal });
    } catch (err) {
      const msg = parseApiError(err);
      setError(msg);
      toast.error(msg);
      setCheckingOut(false);  // ✅ Always reset on error
    }
  }, [cartState, paymentMethod, items.length, grandTotal, setCheckingOut, setOrderSuccess, clearCart, onSuccess]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#0f1117] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-indigo-400" />
            <h2 className="text-white font-semibold font-['Syne']">Checkout</h2>
          </div>
          <button onClick={onClose} disabled={isCheckingOut}
            className="p-1.5 text-white/30 hover:text-white/60 hover:bg-white/[0.05] rounded-lg transition-all disabled:opacity-40">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Offline warning */}
          {!isOnline && (
            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3.5 py-2.5">
              <WifiOff size={14} className="text-amber-400 shrink-0" />
              <p className="text-amber-300 text-xs">You're offline. Order will be queued and synced when reconnected.</p>
            </div>
          )}

          {/* Summary */}
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 space-y-2">
            <p className="text-white/40 text-xs font-medium mb-3 uppercase tracking-wider">Order Summary</p>
            <div className="flex justify-between text-sm text-white/50">
              <span>{items.length} item{items.length !== 1 ? "s" : ""}</span>
              <span className="font-mono">{formatINR(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-white/50">
              <span>Tax (8%)</span>
              <span className="font-mono">{formatINR(tax)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm text-emerald-400">
                <span>Discount</span>
                <span className="font-mono">−{formatINR(discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-white font-bold text-lg border-t border-white/[0.08] pt-2 mt-1">
              <span className="font-['Syne']">Total</span>
              <span className="font-mono text-indigo-300">{formatINR(grandTotal)}</span>
            </div>
          </div>

          {/* Payment Methods */}
          <div>
            <p className="text-white/40 text-xs font-medium mb-2.5 uppercase tracking-wider">Payment Method</p>
            <div className="grid grid-cols-3 gap-2">
              {PAYMENT_METHODS.map(({ id, label, Icon, color }) => {
                const colors = COLOR_MAP[color];
                return (
                  <button key={id} onClick={() => setPaymentMethod(id)}
                    className={clsx(
                      "flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all",
                      paymentMethod === id ? colors.active : "bg-white/[0.03] border-white/[0.08] text-white/40 hover:text-white/60 hover:bg-white/[0.05]"
                    )}>
                    <Icon size={18} className={paymentMethod === id ? colors.icon : undefined} />
                    <span className="text-xs font-medium">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cash calculator */}
          {paymentMethod === "cash" && <CashCalculator total={grandTotal} />}

          {/* PDF notice */}
          <div className="flex items-center gap-2 bg-indigo-500/[0.06] border border-indigo-500/20 rounded-xl px-3.5 py-2">
            <FileDown size={13} className="text-indigo-400 shrink-0" />
            <p className="text-indigo-300/70 text-xs">Invoice PDF will open automatically after payment.</p>
          </div>

          {/* Error */}
          {error && (
            <p className="text-rose-400 text-sm bg-rose-500/10 border border-rose-500/20 rounded-xl px-3.5 py-2.5">
              {error}
            </p>
          )}

          {/* Confirm Button */}
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
            {isCheckingOut
              ? <><Loader2 size={16} className="animate-spin" />Processing…</>
              : <>Confirm Payment · {formatINR(grandTotal)}</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}