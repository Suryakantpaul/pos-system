/**
 * CartPanel.jsx
 * Right-side cart panel — items, quantity controls, totals.
 * Keyboard-navigable, real-time totals, per-item discount.
 */

import React, { memo, useState, useCallback } from "react";
import {
  ShoppingCart, Trash2, Plus, Minus, Tag, ChevronRight,
  UserCircle, FileText, X,
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
    <div className="group flex gap-2.5 p-2.5 rounded-xl hover:bg-white/[0.03] transition-colors border border-transparent hover:border-white/[0.05]">
      {/* Qty Controls */}
      <div className="flex flex-col items-center gap-1 pt-0.5">
        <button
          onClick={() => onQuantityChange(item.productId, item.quantity + 1)}
          className="w-6 h-6 rounded-md bg-white/[0.04] hover:bg-indigo-500/20 text-white/40 hover:text-indigo-300 flex items-center justify-center transition-all active:scale-95"
          aria-label="Increase quantity"
        >
          <Plus size={11} />
        </button>
        <span className="text-white/80 text-sm font-bold tabular-nums w-5 text-center leading-none">
          {item.quantity}
        </span>
        <button
          onClick={() => onQuantityChange(item.productId, item.quantity - 1)}
          className="w-6 h-6 rounded-md bg-white/[0.04] hover:bg-rose-500/20 text-white/40 hover:text-rose-300 flex items-center justify-center transition-all active:scale-95"
          aria-label="Decrease quantity"
        >
          <Minus size={11} />
        </button>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-1">
          <p className="text-white/80 text-sm font-medium leading-snug truncate">
            {truncate(item.name, 22)}
          </p>
          <button
            onClick={() => onRemove(item.productId)}
            className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-rose-400 transition-all shrink-0 mt-0.5"
            aria-label="Remove item"
          >
            <X size={13} />
          </button>
        </div>

        <p className="text-white/30 text-[10px] font-mono">{item.sku}</p>

        <div className="flex items-center gap-2 mt-1.5">
          {/* Unit price */}
          <span className="text-white/40 text-xs font-mono">
            {formatCurrency(item.price)} ea
          </span>

          {/* Discount */}
          {canDiscount && (
            editingDiscount ? (
              <div className="flex items-center gap-1">
                <span className="text-xs text-white/30">−$</span>
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
                  className="w-14 bg-white/[0.06] border border-indigo-500/30 rounded text-xs text-white/80 px-1 py-0.5 outline-none font-mono"
                />
              </div>
            ) : (
              <button
                onClick={() => {
                  setDiscountInput(String(item.discount));
                  setEditingDiscount(true);
                }}
                className={clsx(
                  "text-[10px] px-1.5 py-0.5 rounded border transition-all",
                  item.discount > 0
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : "bg-white/[0.03] text-white/20 border-white/[0.06] hover:text-white/40"
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
        <span className="text-white/80 text-sm font-bold font-mono tabular-nums">
          {formatCurrency(lineTotal)}
        </span>
        {item.discount > 0 && (
          <p className="text-white/25 text-[10px] line-through font-mono">
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

  const handleQty = useCallback(
    (id, qty) => setQuantity(id, qty),
    [setQuantity]
  );
  const handleRemove = useCallback(
    (id) => removeItem(id),
    [removeItem]
  );
  const handleDiscountChange = useCallback(
    (id, val) => setItemDiscount(id, val),
    [setItemDiscount]
  );

  const grandTotal = Math.max(0, total - discount);

  return (
    <div className="flex flex-col h-full bg-[#0d0f14] border-l border-white/[0.06]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-2">
          <ShoppingCart size={16} className="text-indigo-400" />
          <span className="text-white/80 font-semibold text-sm font-['Syne']">
            Cart
          </span>
          {items.length > 0 && (
            <span className="bg-indigo-500/20 text-indigo-300 text-[10px] px-1.5 py-0.5 rounded-full border border-indigo-500/20 font-medium">
              {items.length}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Note toggle */}
          <button
            onClick={() => setShowNote((v) => !v)}
            className={clsx(
              "p-1.5 rounded-lg transition-colors",
              showNote
                ? "text-amber-400 bg-amber-500/10"
                : "text-white/20 hover:text-white/50 hover:bg-white/[0.04]"
            )}
            title="Add note"
          >
            <FileText size={14} />
          </button>

          {/* Clear cart */}
          {items.length > 0 && (
            <button
              onClick={clearCart}
              className="p-1.5 text-white/20 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
              title="Clear cart (Ctrl+Delete)"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Customer */}
      <div className="px-3 py-2 border-b border-white/[0.04] shrink-0">
        <button className="flex items-center gap-2 w-full text-left text-white/30 hover:text-white/50 transition-colors text-xs">
          <UserCircle size={14} />
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
            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white/60 placeholder:text-white/20 outline-none focus:border-white/20 resize-none"
          />
        </div>
      )}

      {/* Items */}
      <div className="flex-1 overflow-y-auto px-2 py-1">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-white/15 gap-3">
            <ShoppingCart size={36} strokeWidth={1} />
            <p className="text-sm text-center leading-snug">
              Cart is empty<br />
              <span className="text-[11px] text-white/10">Click a product or press F2 to search</span>
            </p>
          </div>
        ) : (
          <div className="space-y-0.5">
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

      {/* Totals */}
      {items.length > 0 && (
        <div className="border-t border-white/[0.06] px-4 py-3 space-y-1.5 shrink-0 bg-[#0a0c10]">
          <div className="flex justify-between text-xs text-white/40">
            <span>Subtotal</span>
            <span className="font-mono">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between text-xs text-white/40">
            <span>Tax ({(parseFloat(import.meta.env.VITE_TAX_RATE ?? 0.08) * 100).toFixed(0)}%)</span>
            <span className="font-mono">{formatCurrency(tax)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-xs text-emerald-400">
              <span>Discount</span>
              <span className="font-mono">−{formatCurrency(discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-white font-bold text-base pt-1 border-t border-white/[0.06]">
            <span className="font-['Syne']">Total</span>
            <span className="font-mono text-indigo-300">{formatCurrency(grandTotal)}</span>
          </div>

          {/* Checkout Button */}
          <button
            onClick={onCheckout}
            className="w-full mt-2 h-11 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-indigo-500/20 font-['Syne']"
          >
            Checkout
            <span className="text-white/50 text-xs font-normal font-mono">F12</span>
            <ChevronRight size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
