import React, { memo, useState, useCallback } from "react";
import { Plus, Package, AlertCircle } from "lucide-react";
import { useCartStore } from "../store/cartStore";
import { formatCurrency, truncate } from "../utils";

const CAT = {
  electronics: { bg: "rgba(59,130,246,0.12)", text: "#93c5fd", dot: "#3b82f6" },
  grocery:     { bg: "rgba(34,197,94,0.12)",  text: "#86efac", dot: "#22c55e" },
  beverages:   { bg: "rgba(6,182,212,0.12)",  text: "#67e8f9", dot: "#06b6d4" },
  clothing:    { bg: "rgba(139,92,246,0.12)", text: "#c4b5fd", dot: "#8b5cf6" },
  stationery:  { bg: "rgba(245,158,11,0.12)", text: "#fcd34d", dot: "#f59e0b" },
};
const DEFAULT_CAT = { bg: "rgba(255,255,255,0.06)", text: "rgba(255,255,255,0.4)", dot: "rgba(255,255,255,0.3)" };

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const Skeleton = () => (
  <div style={{
    background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)",
    borderRadius: 14, padding: 16, display: "flex", flexDirection: "column", gap: 10,
  }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div className="skeleton" style={{ height: 18, width: 60, borderRadius: 6 }} />
      <div className="skeleton" style={{ height: 18, width: 18, borderRadius: "50%" }} />
    </div>
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div className="skeleton" style={{ height: 14, width: "75%", borderRadius: 4 }} />
      <div className="skeleton" style={{ height: 11, width: "40%", borderRadius: 4 }} />
    </div>
    <div style={{ height: 1, background: "rgba(255,255,255,0.05)" }} />
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <div className="skeleton" style={{ height: 16, width: 50, borderRadius: 4 }} />
      <div className="skeleton" style={{ height: 12, width: 36, borderRadius: 4 }} />
    </div>
  </div>
);

// ─── Product Card ─────────────────────────────────────────────────────────────

const ProductCard = memo(({ product, onAdd, justAdded }) => {
  const [hovered, setHovered] = useState(false);
  const inStock = (product.stock ?? 999) > 0;
  const isLow = inStock && product.stock != null && product.stock < 10;
  const cat = CAT[product.category?.toLowerCase()] ?? DEFAULT_CAT;

  return (
    <button
      onClick={() => inStock && onAdd(product)}
      disabled={!inStock}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", flexDirection: "column", gap: 12,
        padding: 14, textAlign: "left", borderRadius: 14,
        border: justAdded
          ? "1px solid rgba(99,102,241,0.5)"
          : hovered && inStock
            ? "1px solid rgba(255,255,255,0.14)"
            : "1px solid rgba(255,255,255,0.07)",
        background: justAdded
          ? "rgba(99,102,241,0.08)"
          : hovered && inStock
            ? "rgba(255,255,255,0.05)"
            : "rgba(255,255,255,0.025)",
        opacity: inStock ? 1 : 0.38,
        cursor: inStock ? "pointer" : "not-allowed",
        transition: "all 0.15s ease",
        transform: hovered && inStock ? "translateY(-1px)" : "translateY(0)",
        boxShadow: justAdded ? "0 0 20px rgba(99,102,241,0.15)" : hovered && inStock ? "0 4px 16px rgba(0,0,0,0.3)" : "none",
        fontFamily: "'DM Sans', sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Top row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 4 }}>
        <span style={{
          fontSize: 9, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase",
          padding: "3px 7px", borderRadius: 5,
          background: cat.bg, color: cat.text,
        }}>
          {product.category ?? "general"}
        </span>

        <div style={{
          width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: justAdded ? "#6366f1" : "rgba(255,255,255,0.06)",
          border: justAdded ? "none" : "1px solid rgba(255,255,255,0.1)",
          opacity: justAdded ? 1 : hovered ? 1 : 0,
          transform: justAdded ? "scale(1.1)" : "scale(1)",
          transition: "all 0.15s",
        }}>
          <Plus size={12} color={justAdded ? "#fff" : "rgba(255,255,255,0.7)"} />
        </div>
      </div>

      {/* Name + SKU */}
      <div style={{ flex: 1 }}>
        <p style={{
          fontSize: 13, fontWeight: 500, lineHeight: 1.4, marginBottom: 3,
          color: inStock ? "rgba(255,255,255,0.88)" : "rgba(255,255,255,0.4)",
        }}>
          {truncate(product.name, 28)}
        </p>
        <p style={{
          fontFamily: "'DM Mono', monospace", fontSize: 10,
          color: "rgba(255,255,255,0.22)", letterSpacing: "0.03em",
        }}>
          {product.sku}
        </p>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "0 -2px" }} />

      {/* Price + Stock */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{
          fontFamily: "'DM Mono', monospace", fontSize: 14, fontWeight: 500,
          color: justAdded ? "#a5b4fc" : "#818cf8",
          letterSpacing: "-0.01em",
        }}>
          {formatCurrency(product.price)}
        </span>

        {!inStock && (
          <span style={{ fontSize: 10, color: "#f87171", fontWeight: 500 }}>
            Out of stock
          </span>
        )}
        {isLow && (
          <span style={{
            fontSize: 10, fontWeight: 600, color: "#fbbf24",
            background: "rgba(245,158,11,0.12)", padding: "2px 6px", borderRadius: 4,
          }}>
            {product.stock} left
          </span>
        )}
      </div>

      {/* Shimmer on justAdded */}
      {justAdded && (
        <div style={{
          position: "absolute", inset: 0, borderRadius: 14, pointerEvents: "none",
          background: "linear-gradient(105deg, transparent 40%, rgba(99,102,241,0.12) 50%, transparent 60%)",
          animation: "shimmer 0.6s ease-out",
        }} />
      )}
    </button>
  );
});
ProductCard.displayName = "ProductCard";

// ─── Category Tabs ────────────────────────────────────────────────────────────

const CategoryTabs = memo(({ categories, active, onChange }) => (
  <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2, scrollbarWidth: "none" }}>
    {["all", ...categories].map((cat) => {
      const isActive = active === cat;
      const c = CAT[cat] ?? null;
      return (
        <button
          key={cat}
          onClick={() => onChange(cat)}
          style={{
            flexShrink: 0, fontSize: 11, fontWeight: 600, padding: "5px 12px",
            borderRadius: 8, border: "1px solid", cursor: "pointer",
            textTransform: "capitalize", letterSpacing: "0.02em",
            fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s",
            background: isActive ? (c?.bg ?? "rgba(99,102,241,0.15)") : "rgba(255,255,255,0.03)",
            color: isActive ? (c?.text ?? "#a5b4fc") : "rgba(255,255,255,0.38)",
            borderColor: isActive ? (c?.dot ?? "rgba(99,102,241,0.4)") : "rgba(255,255,255,0.07)",
          }}
        >
          {cat === "all" ? "All items" : cat}
        </button>
      );
    })}
  </div>
));
CategoryTabs.displayName = "CategoryTabs";

// ─── ProductList ──────────────────────────────────────────────────────────────

export default function ProductList({ products = [], categories = [], activeCategory, onCategoryChange, isLoading, error, query }) {
  const addItem = useCartStore((s) => s.addItem);
  const [justAdded, setJustAdded] = useState({});

  const handleAdd = useCallback((product) => {
    addItem(product);
    setJustAdded((p) => ({ ...p, [product._id]: true }));
    setTimeout(() => setJustAdded((p) => ({ ...p, [product._id]: false })), 700);
  }, [addItem]);

  const filtered = activeCategory && activeCategory !== "all"
    ? products.filter((p) => p.category?.toLowerCase() === activeCategory.toLowerCase())
    : products;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, height: "100%", overflow: "hidden" }}>
      {categories.length > 0 && <CategoryTabs categories={categories} active={activeCategory} onChange={onCategoryChange} />}

      {error && (
        <div style={{
          display: "flex", alignItems: "center", gap: 8, padding: "10px 14px",
          background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)",
          borderRadius: 10, color: "#f87171", fontSize: 13,
        }}>
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      <div style={{ flex: 1, overflowY: "auto", paddingRight: 2 }}>
        {isLoading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(155px, 1fr))", gap: 8 }}>
            {Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            height: 240, color: "rgba(255,255,255,0.18)", gap: 10,
          }}>
            <Package size={36} strokeWidth={1} />
            <p style={{ fontSize: 13 }}>{query ? `No results for "${query}"` : "No products available"}</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(155px, 1fr))", gap: 8, paddingBottom: 16 }}>
            {filtered.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                onAdd={handleAdd}
                justAdded={!!justAdded[product._id]}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}