/**
 * ProductList.jsx
 * Upgraded product grid with animations, better cards, and improved UX
 */

import React, { memo, useState, useCallback } from "react";
import { Plus, Tag, Package, ShoppingCart, Zap } from "lucide-react";
import { useCartStore } from "../store/cartStore";
import { formatCurrency, truncate } from "../utils";
import clsx from "clsx";

// ─── Category Icons ───────────────────────────────────────────────
const CATEGORY_EMOJIS = {
  electronics: "⚡",
  grocery: "🛒",
  clothing: "👕",
  beverages: "☕",
  stationery: "✏️",
  all: "✦",
};

// ─── Skeleton Card ───────────────────────────────────────────────
const SkeletonCard = ({ index }) => (
  <div
    className="bg-white/[0.03] border border-white/[0.05] rounded-2xl overflow-hidden animate-pulse"
    style={{ animationDelay: `${index * 50}ms` }}
  >
    <div className="w-full aspect-[4/3] bg-white/[0.05]" />
    <div className="p-3 space-y-2">
      <div className="h-3.5 bg-white/[0.05] rounded-full w-3/4" />
      <div className="h-3 bg-white/[0.03] rounded-full w-1/2" />
      <div className="flex justify-between items-center pt-1">
        <div className="h-5 bg-white/[0.05] rounded-full w-1/3" />
        <div className="h-4 bg-white/[0.03] rounded-full w-1/4" />
      </div>
    </div>
  </div>
);

// ─── Product Card ────────────────────────────────────────────────
const ProductCard = memo(({ product, onAdd, justAdded, index }) => {
  const inStock = (product.stock ?? product.quantity ?? 999) > 0;
  const isLowStock = inStock && product.stock != null && product.stock < 10;
  const [imgError, setImgError] = useState(false);

  return (
    <button
      onClick={() => inStock && onAdd(product)}
      disabled={!inStock}
      style={{ animationDelay: `${index * 40}ms` }}
      className={clsx(
        "group relative rounded-2xl text-left overflow-hidden",
        "transition-all duration-200",
        "border",
        inStock
          ? "cursor-pointer hover:-translate-y-1 hover:shadow-xl hover:shadow-black/30"
          : "cursor-not-allowed opacity-50",
        justAdded
          ? "ring-2 ring-indigo-500 border-indigo-500/40 bg-indigo-500/10 scale-[0.98]"
          : "bg-white/[0.03] border-white/[0.07] hover:border-white/[0.15] hover:bg-white/[0.05]",
      )}
    >
      {/* Image Container */}
      <div className="relative w-full aspect-[4/3] overflow-hidden bg-white/[0.04]">
        {(product.image || product.imageUrl) && !imgError ? (
          <img
            src={product.image || product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package size={28} className="text-white/10" />
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Category badge */}
        {product.category && (
          <div className="absolute top-2 left-2">
            <span className="text-[9px] bg-black/50 backdrop-blur-sm text-white/60 px-1.5 py-0.5 rounded-full border border-white/10 uppercase tracking-wider">
              {CATEGORY_EMOJIS[product.category] || "•"} {product.category}
            </span>
          </div>
        )}

        {/* Add button */}
        <div className={clsx(
          "absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200",
          justAdded
            ? "bg-indigo-500 scale-110 opacity-100"
            : "bg-black/40 backdrop-blur-sm border border-white/20 opacity-0 group-hover:opacity-100 hover:bg-indigo-500 hover:border-indigo-400"
        )}>
          {justAdded
            ? <ShoppingCart size={13} className="text-white" />
            : <Plus size={13} className="text-white" />
          }
        </div>

        {/* Out of stock overlay */}
        {!inStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-rose-400 text-xs font-semibold bg-black/50 px-2 py-1 rounded-full border border-rose-500/30">
              Out of Stock
            </span>
          </div>
        )}

        {/* Just added flash */}
        {justAdded && (
          <div className="absolute inset-0 bg-indigo-500/20 animate-pulse" />
        )}
      </div>

      {/* Card Content */}
      <div className="p-3">
        <p className="text-white/85 text-sm font-medium leading-snug mb-0.5 group-hover:text-white transition-colors">
          {truncate(product.name, 24)}
        </p>

        <p className="text-white/25 text-[10px] font-mono mb-2.5">
          {product.sku}
        </p>

        <div className="flex items-center justify-between">
          <span className={clsx(
            "font-bold text-sm font-mono transition-colors",
            justAdded ? "text-indigo-300" : "text-indigo-400 group-hover:text-indigo-300"
          )}>
            {formatCurrency(product.price)}
          </span>

          {isLowStock && (
            <span className="flex items-center gap-1 text-amber-400/80 text-[10px] font-medium">
              <Zap size={9} />
              {product.stock} left
            </span>
          )}
        </div>
      </div>

      {/* Bottom accent line on hover */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500 to-violet-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
    </button>
  );
});
ProductCard.displayName = "ProductCard";

// ─── Category Tabs ───────────────────────────────────────────────
const CategoryTabs = memo(({ categories, active, onChange }) => (
  <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
    {["all", ...categories].map((cat) => (
      <button
        key={cat}
        onClick={() => onChange(cat)}
        className={clsx(
          "shrink-0 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl capitalize font-medium transition-all duration-200 border",
          active === cat
            ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/30 shadow-lg shadow-indigo-500/10"
            : "bg-white/[0.03] text-white/40 border-white/[0.06] hover:text-white/70 hover:bg-white/[0.07] hover:border-white/[0.10]"
        )}
      >
        <span>{CATEGORY_EMOJIS[cat] || "•"}</span>
        <span>{cat}</span>
      </button>
    ))}
  </div>
));
CategoryTabs.displayName = "CategoryTabs";

// ─── ProductList ─────────────────────────────────────────────────
export default function ProductList({
  products = [],
  categories = [],
  activeCategory,
  onCategoryChange,
  isLoading = false,
  error = null,
  query = "",
}) {
  const addItem = useCartStore((s) => s.addItem);
  const [justAdded, setJustAdded] = useState({});

  const handleAdd = useCallback(
    (product) => {
      addItem(product);
      setJustAdded((prev) => ({ ...prev, [product._id]: true }));
      setTimeout(
        () => setJustAdded((prev) => ({ ...prev, [product._id]: false })),
        700
      );
    },
    [addItem]
  );

  const filtered =
    activeCategory && activeCategory !== "all"
      ? products.filter(
          (p) => p.category?.toLowerCase() === activeCategory.toLowerCase()
        )
      : products;

  return (
    <div className="flex flex-col gap-3 h-full overflow-hidden">
      {/* Category Tabs */}
      {categories.length > 0 && (
        <CategoryTabs
          categories={categories}
          active={activeCategory}
          onChange={onCategoryChange}
        />
      )}

      {/* Error */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 text-rose-400 text-sm flex items-center gap-2">
          <Tag size={14} />
          <span>{error}</span>
        </div>
      )}

      {/* Product count */}
      {!isLoading && filtered.length > 0 && (
        <p className="text-white/20 text-xs">
          {filtered.length} product{filtered.length !== 1 ? "s" : ""}
          {activeCategory && activeCategory !== "all" ? ` in ${activeCategory}` : ""}
        </p>
      )}

      {/* Grid */}
      <div className="flex-1 overflow-y-auto pr-0.5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5">
            {Array.from({ length: 12 }).map((_, i) => (
              <SkeletonCard key={i} index={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-white/20 gap-3">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center">
              <Package size={28} className="opacity-50" />
            </div>
            <p className="text-sm">
              {query ? `No results for "${query}"` : "No products available"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 pb-4">
            {filtered.map((product, index) => (
              <ProductCard
                key={product._id}
                product={product}
                onAdd={handleAdd}
                justAdded={!!justAdded[product._id]}
                index={index}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}