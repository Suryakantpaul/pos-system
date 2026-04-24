/**
 * ProductList.jsx
 * Grid/list of products with category tabs, skeleton loaders,
 * and optimistic add-to-cart feedback.
 */

import React, { memo, useState, useCallback } from "react";
import { Plus, Tag, Package } from "lucide-react";
import { useCartStore } from "../store/cartStore";
import { formatCurrency, truncate } from "../utils";
import clsx from "clsx";

// ─── Skeleton Card ───────────────────────────────────────────────

const SkeletonCard = () => (
  <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-3 animate-pulse">
    <div className="w-full aspect-[4/3] bg-white/[0.05] rounded-lg mb-3" />
    <div className="h-3.5 bg-white/[0.05] rounded w-3/4 mb-2" />
    <div className="h-3 bg-white/[0.03] rounded w-1/2 mb-3" />
    <div className="h-5 bg-white/[0.05] rounded w-1/3" />
  </div>
);

// ─── Product Card ────────────────────────────────────────────────

const ProductCard = memo(({ product, onAdd, justAdded }) => {
  const inStock = (product.stock ?? product.quantity ?? 999) > 0;

  return (
    <button
      onClick={() => inStock && onAdd(product)}
      disabled={!inStock}
      className={clsx(
        "group relative bg-white/[0.03] border rounded-xl p-3 text-left",
        "transition-all duration-150 active:scale-[0.97]",
        "hover:bg-white/[0.06] hover:border-white/[0.12]",
        inStock
          ? "border-white/[0.06] cursor-pointer"
          : "border-white/[0.03] opacity-40 cursor-not-allowed",
        justAdded && "ring-1 ring-indigo-500/50 bg-indigo-500/5 border-indigo-500/20"
      )}
    >
      {/* Category badge */}
      {product.category && (
        <span className="absolute top-2 left-2 text-[9px] bg-white/[0.06] text-white/40 px-1.5 py-0.5 rounded-full border border-white/[0.08] uppercase tracking-wider">
          {product.category}
        </span>
      )}

      {/* Add indicator */}
      <div
        className={clsx(
          "absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition-all",
          justAdded
            ? "bg-indigo-500 scale-110"
            : "bg-white/[0.04] border border-white/[0.08] opacity-0 group-hover:opacity-100"
        )}
      >
        <Plus size={13} className="text-white" />
      </div>

      {/* Image / placeholder */}
      <div className="w-full aspect-[4/3] bg-white/[0.04] rounded-lg mb-2.5 overflow-hidden flex items-center justify-center">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <Package size={24} className="text-white/10" />
        )}
      </div>

      {/* Name */}
      <p className="text-white/80 text-sm font-medium leading-snug mb-0.5">
        {truncate(product.name, 28)}
      </p>

      {/* SKU */}
      <p className="text-white/25 text-[10px] font-mono mb-2">
        {product.sku}
      </p>

      {/* Price + Stock */}
      <div className="flex items-end justify-between">
        <span className="text-indigo-400 font-bold text-sm font-mono">
          {formatCurrency(product.price)}
        </span>
        {!inStock && (
          <span className="text-rose-400/70 text-[10px]">Out of stock</span>
        )}
        {inStock && product.stock != null && product.stock < 10 && (
          <span className="text-amber-400/70 text-[10px]">
            {product.stock} left
          </span>
        )}
      </div>
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
          "shrink-0 text-xs px-3 py-1.5 rounded-lg capitalize font-medium transition-all border",
          active === cat
            ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/30"
            : "bg-white/[0.04] text-white/40 border-white/[0.06] hover:text-white/60 hover:bg-white/[0.06]"
        )}
      >
        {cat}
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
        600
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

      {/* Grid */}
      <div className="flex-1 overflow-y-auto pr-0.5">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5">
            {Array.from({ length: 12 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-white/20">
            <Package size={40} className="mb-3 opacity-50" />
            <p className="text-sm">
              {query ? `No products found for "${query}"` : "No products available"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 pb-4">
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
