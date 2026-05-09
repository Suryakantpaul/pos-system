/**
 * CartPanel.jsx
 * Upgraded right-side cart panel with animations and better design
 */

import React, { memo, useState, useCallback } from "react";
import {
  ShoppingCart, Trash2, Plus, Minus, Tag, ChevronRight,
  UserCircle, FileText, X, Sparkles, Receipt,
} from "lucide-react";
import { useCartStore } from "../store/cartStore";
import { useAuthStore, canApplyDiscounts } from "../store/authStore";
import { formatCurrency, truncate } from "../utils";
import clsx from "clsx";

// ─── CartItem ────────────────────────────────────────────────────
const CartItem = memo(({ item, onQuantityChange, onRemove, onDiscountChange, canDiscount }) => {
  const [editingDiscount, setEditingDiscount] = useState(false);
  const [discountInput, setDiscountInput] = useState(String(item.discount));
  const lineTotal = (item.price - item.discount) * item.quantity;

  const commitDiscount = () => {
    const val = parseFloat(discountInput);
    if (!isNaN(val)) onDiscountChange(item.productId, val);
    setEditingDiscount(false);
  };

  return (
    <div className="group flex gap-2.5 p-2.5 rounded-xl hover:bg-white/[0.04] transition-all duration-200 border border-transparent hover:border-white/[0.06]">
      {/* Qty Controls */}
      <div className="flex flex-col items-center gap-1 pt-0.5">
        <button
          onClick={() => onQuantityChange(item.productId, item.quantity + 1)}
          className="w-6 h-6 rounded-lg bg-white/[0.04] hover:bg-indigo-500/25 text-white/40 hover:text-indigo-300 flex items-center justify-center transition-all active:scale-90 border border-white/[0.06] hover:border-indigo-500/30"
        >
          <Plus size={11} />
        </button>
        <span className="text-white/90 text-sm font-bold tabular-nums w-5 text-center leading-none">
          {item.quantity}
        </span>
        <button
          onClick={() => onQuantityChange(item.productId, item.quantity - 1)}
          className="w-6 h-6 rounded-lg bg-white/[0.04] hover:bg-rose-500/25 text-white/40 hover:text-rose-300 flex items-center justify-center transition-all active:scale-90 border border-white/[0.06] hover:border-rose-500/30"
        >
          <Minus size={11} />
        </button>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-1">
          <p className="text-white/85 text-sm font-medium leading-snug truncate">
            {truncate(item.name, 20)}
          </p>
          <button
            onClick={() => onRemove(item.productId)}
            className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-rose-400 transition-all shrink-0 mt-0.5 hover:bg-rose-500/10 rounded p-0.5"
          >
            <X size={12} />
          </button>
        </div>

        <p className="text-white/25 text-[10px] font-mono mt-0.5">{item.sku}</p>

        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-white/35 text-[10px] font-mono">
            {formatCurrency(item.price)} ea
          </span>

          {canDiscount && (
            editingDiscount ? (
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-white/30">−$</span>
                <input
                  autoFocus
                  type="number"
                  min="0"
                  max={item.price}
                  step="0.01"
                  value={discountInput}
                  onChange={(e) => setDiscountInput(e.target.value)}
                  onBlur={commitDiscount}
                  onKeyDown={(e) => e.key === "Enter" && commitDiscount()}
                  className="w-14 bg-white/[0.06] border border-indigo-500/40 rounded-lg text-[10px] text-white/80 px-1.5 py-0.5 outline-none font-mono"
                />
              </div>
            ) : (
              <button
                onClick={() => { setDiscountInput(String(item.discount)); setEditingDiscount(true); }}
                className={clsx(
                  "text-[10px] px-1.5 py-0.5 rounded-lg border transition-all",
                  item.discount > 0
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : "bg-white/[0.03] text-white/15 border-white/[0.05] hover:text-white/40 hover:border-white/[0.10]"
                )}
              >
                {item.discount > 0 ? `−${formatCurrency(item.discount)}` : <Tag size={9} />}
              </button>
            )
          )}
        </div>
      </div>

      {/* Line Total */}
      <div className="text-right shrink-0 pt-0.5">
        <span className="text-white/85 text-sm font-bold font-mono tabular-nums">
          {formatCurrency(lineTotal)}
        </span>
        {item.discount > 0 && (
          <p className="text-white/20 text-[10px] line-through font-mono">
            {formatCurrency(item.price * item.quantity)}
          </p>
        )}
      </div>
    </div>
  );
});
CartItem.displayName = "CartItem";

// ─── CartPanel ───────────────────────────────────────────────────
export default function CartPanel({ onCheckout }) {
  const {
    items, subtotal, tax, total, discount,
    removeItem, setQuantity, setItemDiscount,
    setCustomer, customer, note, setNote,
    clearCart,
  } = useCartStore();
  const { role } = useAuthStore();
  const canDiscount = canApplyDiscounts(role);
  const [showNote, setShowNote] = useState(false);

  const handleQty = useCallback((id, qty) => setQuantity(id, qty), [setQuantity]);
  const handleRemove = useCallback((id) => removeItem(id), [removeItem]);
  const handleDiscountChange = useCallback((id, val) => setItemDiscount(id, val), [setItemDiscount]);

  const grandTotal = Math.max(0, total - discount);
  const itemCount = items.reduce((a, i) => a + i.quantity, 0);

  return (
    <div className="flex flex-col h-full bg-[#0d0f14] border-l border-white/[0.06] relative">
      {/* Top gradient accent */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center">
            <ShoppingCart size={14} className="text-indigo-400" />
          </div>
          <span className="text-white/85 font-semibold text-sm">Cart</span>
          {items.length > 0 && (
            <span className="bg-indigo-500/20 text-indigo-300 text-[10px] px-1.5 py-0.5 rounded-full border border-indigo-500/20 font-medium animate-pulse">
              {itemCount}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowNote((v) => !v)}
            className={clsx(
              "p-1.5 rounded-lg transition-all duration-200",
              showNote
                ? "text-amber-400 bg-amber-500/10 border border-amber-500/20"
                : "text-white/20 hover:text-white/50 hover:bg-white/[0.05]"
            )}
            title="Add note"
          >
            <FileText size={13} />
          </button>

          {items.length > 0 && (
            <button
              onClick={clearCart}
              className="p-1.5 text-white/20 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all duration-200"
              title="Clear cart"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Customer */}
      <div className="px-3 py-2 border-b border-white/[0.04] shrink-0">
        <button className="flex items-center gap-2 w-full text-left text-white/25 hover:text-white/50 transition-colors text-xs group">
          <UserCircle size={13} className="group-hover:text-indigo-400 transition-colors" />
          <span>{customer?.name ?? "Walk-in Customer"}</span>
        </button>
      </div>

      {/* Note */}
      {showNote && (
        <div className="px-3 py-2 border-b border-white/[0.04] shrink-0">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Order note…"
            rows={2}
            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white/60 placeholder:text-white/20 outline-none focus:border-indigo-500/30 resize-none transition-colors"
          />
        </div>
      )}

      {/* Items */}
      <div className="flex-1 overflow-y-auto px-2 py-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-white/15 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-center">
              <ShoppingCart size={28} strokeWidth={1} className="text-white/20" />
            </div>
            <div className="text-center">
              <p className="text-sm text-white/20 mb-1">Cart is empty</p>
              <p className="text-[11px] text-white/10">Click a product to add it</p>
            </div>
          </div>
        ) : (
          <div className="space-y-0.5 py-1">
            {items.map((item) => (
              <CartItem
                key={item.productId}
                item={item}
                onQuantityChange={handleQty}
                onRemove={handleRemove}
                onDiscountChange={handleDiscountChange}
                canDiscount={canDiscount}
              />
            ))}
          </div>
        )}
      </div>

      {/* Totals + Checkout */}
      {items.length > 0 && (
        <div className="border-t border-white/[0.06] px-4 py-3 space-y-2 shrink-0 bg-[#0a0c10]">
          {/* Receipt icon */}
          <div className="flex items-center gap-2 mb-3">
            <Receipt size={12} className="text-white/20" />
            <span className="text-white/20 text-[10px] uppercase tracking-widest">Order Summary</span>
          </div>

          <div className="flex justify-between text-xs text-white/35">
            <span>Subtotal ({itemCount} items)</span>
            <span className="font-mono">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between text-xs text-white/35">
            <span>Tax ({(parseFloat(import.meta.env.VITE_TAX_RATE ?? 0.08) * 100).toFixed(0)}%)</span>
            <span className="font-mono">{formatCurrency(tax)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-xs text-emerald-400">
              <span className="flex items-center gap-1">
                <Sparkles size={10} /> Discount
              </span>
              <span className="font-mono">−{formatCurrency(discount)}</span>
            </div>
          )}

          <div className="flex justify-between text-white font-bold text-base pt-2 border-t border-white/[0.06] mt-1">
            <span>Total</span>
            <span className="font-mono text-indigo-300 text-lg">{formatCurrency(grandTotal)}</span>
          </div>

          {/* Checkout Button */}
          <button
            onClick={onCheckout}
            className="w-full mt-1 h-12 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 group"
          >
            <ShoppingCart size={15} className="group-hover:scale-110 transition-transform" />
            Checkout
            <span className="text-white/40 text-xs font-normal font-mono ml-1">F12</span>
            <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      )}
    </div>
  );
}