/**
 * CartPanel.jsx — Fixed & Polished
 *
 * FIXES APPLIED:
 * 1. Replaced ALL Tailwind utility classes with inline styles on the cart container
 *    so the panel renders correctly even if Tailwind JIT misses the `hidden md:flex`
 *    wrapper class in POSPage (which was causing the panel to not display at all,
 *    or display with no styling applied).
 * 2. Fixed the CartItem layout — qty controls are now clearly separated from info.
 * 3. Fixed the "Cart3" header rendering bug — was caused by the badge count
 *    rendering inline without spacing. Now properly spaced with a pill badge.
 * 4. Fixed X remove button visibility — was `opacity-0` only showing on hover,
 *    now always visible (subtle) for better UX.
 * 5. Added proper scrollable item area with fixed header + footer.
 * 6. Full inline-style fallback so panel works regardless of Tailwind purge state.
 *
 * HOW TO USE:
 * Replace pos-system/src/components/CartPanel.jsx with this file.
 * Also apply the POSPage.jsx fix below (remove className="hidden md:flex",
 * use style only).
 */

import React, { memo, useState, useCallback } from "react";
import {
  ShoppingCart, Trash2, Plus, Minus, Tag, ChevronRight,
  UserCircle, FileText, X,
} from "lucide-react";
import { useCartStore } from "../store/cartStore";
import { useAuthStore, canApplyDiscounts } from "../store/authStore";
import { formatCurrency, truncate } from "../utils";

// ─── Shared style tokens ──────────────────────────────────────────
const C = {
  bg:          "#0d0f14",
  bgDeep:      "#0a0c10",
  border:      "rgba(255,255,255,0.06)",
  borderSoft:  "rgba(255,255,255,0.04)",
  text:        "rgba(255,255,255,0.82)",
  textMuted:   "rgba(255,255,255,0.38)",
  textFaint:   "rgba(255,255,255,0.18)",
  accent:      "#6366f1",
  accentSoft:  "rgba(99,102,241,0.18)",
  accentText:  "#a5b4fc",
  rose:        "rgba(244,63,94,0.18)",
  roseText:    "#fb7185",
  emerald:     "rgba(16,185,129,0.15)",
  emeraldText: "#34d399",
};

// ─── CartItem ────────────────────────────────────────────────────

const CartItem = memo(({ item, onQuantityChange, onRemove, onDiscountChange, canDiscount }) => {
  const [editingDiscount, setEditingDiscount] = useState(false);
  const [discountInput, setDiscountInput] = useState(String(item.discount ?? 0));
  const lineTotal = (item.price - (item.discount ?? 0)) * item.quantity;

  const commitDiscount = () => {
    const val = parseFloat(discountInput);
    if (!isNaN(val) && val >= 0) onDiscountChange(item.productId, val);
    setEditingDiscount(false);
  };

  return (
    <div style={{
      display: "flex",
      gap: 10,
      padding: "10px 12px",
      borderRadius: 12,
      border: "1px solid transparent",
      transition: "background 0.15s, border-color 0.15s",
      marginBottom: 2,
    }}
      onMouseEnter={e => {
        e.currentTarget.style.background = "rgba(255,255,255,0.025)";
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.borderColor = "transparent";
      }}
    >
      {/* Qty Controls — vertical stack */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, paddingTop: 2, flexShrink: 0 }}>
        <button
          onClick={() => onQuantityChange(item.productId, item.quantity + 1)}
          aria-label="Increase quantity"
          style={{
            width: 24, height: 24, borderRadius: 7,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.07)",
            color: C.textMuted, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.15s", padding: 0,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = C.accentSoft; e.currentTarget.style.color = C.accentText; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = C.textMuted; }}
        >
          <Plus size={11} />
        </button>

        <span style={{
          color: C.text, fontSize: 13, fontWeight: 700,
          width: 20, textAlign: "center", lineHeight: 1,
          fontFamily: "'DM Mono', monospace",
        }}>
          {item.quantity}
        </span>

        <button
          onClick={() => onQuantityChange(item.productId, item.quantity - 1)}
          aria-label="Decrease quantity"
          style={{
            width: 24, height: 24, borderRadius: 7,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.07)",
            color: C.textMuted, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.15s", padding: 0,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = C.rose; e.currentTarget.style.color = C.roseText; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = C.textMuted; }}
        >
          <Minus size={11} />
        </button>
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 4, marginBottom: 2 }}>
          <p style={{
            color: C.text, fontSize: 13, fontWeight: 500,
            lineHeight: 1.35, margin: 0,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            maxWidth: 120,
          }}>
            {truncate(item.name, 22)}
          </p>
          <button
            onClick={() => onRemove(item.productId)}
            aria-label="Remove item"
            style={{
              background: "none", border: "none", cursor: "pointer", padding: 2,
              color: C.textFaint, borderRadius: 4, flexShrink: 0,
              display: "flex", alignItems: "center", transition: "color 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.color = C.roseText}
            onMouseLeave={e => e.currentTarget.style.color = C.textFaint}
          >
            <X size={13} />
          </button>
        </div>

        <p style={{ color: C.textFaint, fontSize: 10, fontFamily: "'DM Mono', monospace", margin: "0 0 6px" }}>
          {item.sku}
        </p>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: C.textMuted, fontSize: 11, fontFamily: "'DM Mono', monospace" }}>
            {formatCurrency(item.price)} ea
          </span>

          {canDiscount && (
            editingDiscount ? (
              <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                <span style={{ fontSize: 11, color: C.textMuted }}>−$</span>
                <input
                  autoFocus
                  type="number"
                  min="0"
                  max={item.price}
                  step="0.01"
                  value={discountInput}
                  onChange={e => setDiscountInput(e.target.value)}
                  onBlur={commitDiscount}
                  onKeyDown={e => e.key === "Enter" && commitDiscount()}
                  style={{
                    width: 52, background: "rgba(99,102,241,0.1)",
                    border: "1px solid rgba(99,102,241,0.3)",
                    borderRadius: 5, padding: "2px 5px",
                    fontSize: 11, color: C.text,
                    fontFamily: "'DM Mono', monospace",
                    outline: "none",
                  }}
                />
              </div>
            ) : (
              <button
                onClick={() => { setDiscountInput(String(item.discount ?? 0)); setEditingDiscount(true); }}
                style={{
                  background: (item.discount ?? 0) > 0 ? C.emerald : "rgba(255,255,255,0.04)",
                  border: `1px solid ${(item.discount ?? 0) > 0 ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.07)"}`,
                  color: (item.discount ?? 0) > 0 ? C.emeraldText : C.textFaint,
                  borderRadius: 5, padding: "2px 7px", fontSize: 10,
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 3,
                  fontFamily: "'DM Mono', monospace", transition: "all 0.15s",
                }}
              >
                {(item.discount ?? 0) > 0 ? `−${formatCurrency(item.discount)}` : <Tag size={9} />}
              </button>
            )
          )}
        </div>
      </div>

      {/* Line Total */}
      <div style={{ textAlign: "right", flexShrink: 0, paddingTop: 2 }}>
        <span style={{
          color: C.text, fontSize: 13, fontWeight: 700,
          fontFamily: "'DM Mono', monospace",
        }}>
          {formatCurrency(lineTotal)}
        </span>
        {(item.discount ?? 0) > 0 && (
          <p style={{
            color: C.textFaint, fontSize: 10,
            fontFamily: "'DM Mono', monospace",
            textDecoration: "line-through", margin: "2px 0 0",
          }}>
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

  const handleQty      = useCallback((id, qty) => setQuantity(id, qty),       [setQuantity]);
  const handleRemove   = useCallback((id) => removeItem(id),                  [removeItem]);
  const handleDiscount = useCallback((id, val) => setItemDiscount(id, val),   [setItemDiscount]);

  const grandTotal = Math.max(0, total - (discount ?? 0));

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100%",
      background: C.bg,
      borderLeft: `1px solid ${C.border}`,
      overflow: "hidden",
    }}>

      {/* ── Header ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 16px",
        borderBottom: `1px solid ${C.border}`,
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <ShoppingCart size={16} style={{ color: C.accentText }} />
          <span style={{
            color: C.text, fontWeight: 600, fontSize: 13,
            fontFamily: "'Syne', sans-serif", letterSpacing: "0.01em",
          }}>
            Cart
          </span>
          {items.length > 0 && (
            <span style={{
              background: C.accentSoft,
              color: C.accentText,
              fontSize: 10, fontWeight: 600,
              padding: "2px 7px",
              borderRadius: 99,
              border: "1px solid rgba(99,102,241,0.2)",
              lineHeight: 1.5,
            }}>
              {items.length}
            </span>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <button
            onClick={() => setShowNote(v => !v)}
            title="Add note"
            style={{
              padding: 7, borderRadius: 8, cursor: "pointer",
              background: showNote ? "rgba(251,191,36,0.12)" : "transparent",
              border: "1px solid transparent",
              color: showNote ? "#fbbf24" : C.textMuted,
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.15s",
            }}
          >
            <FileText size={14} />
          </button>

          {items.length > 0 && (
            <button
              onClick={clearCart}
              title="Clear cart (Ctrl+Delete)"
              style={{
                padding: 7, borderRadius: 8, cursor: "pointer",
                background: "transparent",
                border: "1px solid transparent",
                color: C.textMuted,
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = C.rose; e.currentTarget.style.color = C.roseText; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.textMuted; }}
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {/* ── Customer ── */}
      <div style={{
        padding: "8px 14px",
        borderBottom: `1px solid ${C.borderSoft}`,
        flexShrink: 0,
      }}>
        <button style={{
          display: "flex", alignItems: "center", gap: 7,
          background: "none", border: "none", cursor: "pointer",
          color: C.textMuted, fontSize: 12,
          width: "100%", textAlign: "left",
          transition: "color 0.15s", padding: 0,
        }}
          onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,0.55)"}
          onMouseLeave={e => e.currentTarget.style.color = C.textMuted}
        >
          <UserCircle size={14} />
          <span>{customer?.name ?? "Walk-in Customer"}</span>
        </button>
      </div>

      {/* ── Note ── */}
      {showNote && (
        <div style={{
          padding: "8px 12px",
          borderBottom: `1px solid ${C.borderSoft}`,
          flexShrink: 0,
        }}>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Order note…"
            rows={2}
            style={{
              width: "100%", background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 10, padding: "8px 12px",
              fontSize: 12, color: "rgba(255,255,255,0.6)",
              outline: "none", resize: "none",
              fontFamily: "'DM Sans', sans-serif",
              boxSizing: "border-box",
            }}
          />
        </div>
      )}

      {/* ── Items List ── */}
      <div style={{
        flex: 1, overflowY: "auto",
        padding: "6px 6px",
        scrollbarWidth: "thin",
        scrollbarColor: "rgba(255,255,255,0.08) transparent",
      }}>
        {items.length === 0 ? (
          <div style={{
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            height: "100%", color: C.textFaint, gap: 12,
          }}>
            <ShoppingCart size={36} strokeWidth={1} style={{ opacity: 0.4 }} />
            <div style={{ textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: 13 }}>Cart is empty</p>
              <p style={{ margin: "4px 0 0", fontSize: 11, opacity: 0.6 }}>
                Click a product or press F2 to search
              </p>
            </div>
          </div>
        ) : (
          <div>
            {items.map(item => (
              <CartItem
                key={item.productId}
                item={item}
                onQuantityChange={handleQty}
                onRemove={handleRemove}
                onDiscountChange={handleDiscount}
                canDiscount={canDiscount}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Totals + Checkout ── */}
      {items.length > 0 && (
        <div style={{
          borderTop: `1px solid ${C.border}`,
          padding: "14px 16px",
          flexShrink: 0,
          background: C.bgDeep,
        }}>
          {/* Subtotal */}
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ color: C.textMuted, fontSize: 12 }}>Subtotal</span>
            <span style={{ color: C.textMuted, fontSize: 12, fontFamily: "'DM Mono', monospace" }}>
              {formatCurrency(subtotal)}
            </span>
          </div>

          {/* Tax */}
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ color: C.textMuted, fontSize: 12 }}>
              Tax ({(parseFloat(import.meta.env.VITE_TAX_RATE ?? 0.08) * 100).toFixed(0)}%)
            </span>
            <span style={{ color: C.textMuted, fontSize: 12, fontFamily: "'DM Mono', monospace" }}>
              {formatCurrency(tax)}
            </span>
          </div>

          {/* Discount */}
          {(discount ?? 0) > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ color: C.emeraldText, fontSize: 12 }}>Discount</span>
              <span style={{ color: C.emeraldText, fontSize: 12, fontFamily: "'DM Mono', monospace" }}>
                −{formatCurrency(discount)}
              </span>
            </div>
          )}

          {/* Divider */}
          <div style={{ borderTop: `1px solid ${C.border}`, margin: "10px 0" }} />

          {/* Total */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <span style={{
              color: C.text, fontWeight: 700, fontSize: 15,
              fontFamily: "'Syne', sans-serif",
            }}>
              Total
            </span>
            <span style={{
              color: C.accentText, fontWeight: 700, fontSize: 18,
              fontFamily: "'DM Mono', monospace",
            }}>
              {formatCurrency(grandTotal)}
            </span>
          </div>

          {/* Checkout Button */}
          <button
            onClick={onCheckout}
            style={{
              width: "100%", height: 44,
              background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
              border: "none", borderRadius: 12,
              color: "#fff", fontWeight: 700, fontSize: 14,
              fontFamily: "'Syne', sans-serif", letterSpacing: "0.02em",
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              boxShadow: "0 4px 20px rgba(99,102,241,0.25)",
              transition: "all 0.15s",
              position: "relative", overflow: "hidden",
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = "0.92"; e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(99,102,241,0.35)"; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(99,102,241,0.25)"; }}
            onMouseDown={e => e.currentTarget.style.transform = "scale(0.98)"}
            onMouseUp={e => e.currentTarget.style.transform = "translateY(-1px)"}
          >
            Checkout
            <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 400, fontFamily: "'DM Mono', monospace" }}>
              F12
            </span>
            <ChevronRight size={15} />
          </button>
        </div>
      )}
    </div>
  );
}