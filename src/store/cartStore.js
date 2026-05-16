/**
 * cartStore.js
 * ─────────────────────────────────────────────────────────────────
 * Zustand store for the POS cart.
 * Persists to localStorage for offline resilience.
 * ─────────────────────────────────────────────────────────────────
 */

import { create } from "zustand";
import { persist, subscribeWithSelector } from "zustand/middleware";

const TAX_RATE = parseFloat(import.meta.env.VITE_TAX_RATE ?? "0.08");

// ─── Helpers ────────────────────────────────────────────────────

const calcTotals = (items) => {
  const subtotal = items.reduce(
    (sum, item) => sum + (item.price - item.discount) * item.quantity,
    0
  );
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;
  return { subtotal, tax, total };
};

// ─── Store ──────────────────────────────────────────────────────

export const useCartStore = create(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // ── State ──────────────────────────────────────────────
        items: [],
        subtotal: 0,
        tax: 0,
        total: 0,
        discount: 0,          // global cart-level discount (flat $)
        customer: null,       // { id, name, email }
        note: "",
        isCheckingOut: false,
        lastOrderId: null,

        // ── Actions ────────────────────────────────────────────

        /** Add a product or increment its quantity */
        addItem: (product) => {
          const items = get().items;
          const existing = items.find((i) => i.productId === product._id);

          let updated;
          if (existing) {
            updated = items.map((i) =>
              i.productId === product._id
                ? { ...i, quantity: i.quantity + 1 }
                : i
            );
          } else {
            updated = [
              ...items,
              {
                productId: product._id,
                name: product.name,
                sku: product.sku,
                price: product.price,
                quantity: 1,
                discount: 0,
                imageUrl: product.image ?? product.imageUrl ?? null,
                category: product.category ?? "",
              },
            ];
          }

          set({ items: updated, ...calcTotals(updated) });
        },

        /** Remove a product entirely */
        removeItem: (productId) => {
          const updated = get().items.filter((i) => i.productId !== productId);
          set({ items: updated, ...calcTotals(updated) });
        },

        /** Set an exact quantity (0 = remove) */
        setQuantity: (productId, quantity) => {
          if (quantity <= 0) {
            get().removeItem(productId);
            return;
          }
          const updated = get().items.map((i) =>
            i.productId === productId ? { ...i, quantity } : i
          );
          set({ items: updated, ...calcTotals(updated) });
        },

        /** Set per-item discount (flat $ amount) */
        setItemDiscount: (productId, discount) => {
          const updated = get().items.map((i) =>
            i.productId === productId
              ? { ...i, discount: Math.max(0, Math.min(discount, i.price)) }
              : i
          );
          set({ items: updated, ...calcTotals(updated) });
        },

        /** Set global cart note */
        setNote: (note) => set({ note }),

        /** Set customer */
        setCustomer: (customer) => set({ customer }),

        /** Set global cart-level discount */
        setCartDiscount: (discount) => {
          set({ discount: Math.max(0, discount) });
        },

        /** Set checkout loading state */
        setCheckingOut: (val) => set({ isCheckingOut: val }),

        /** Mark order success */
        setOrderSuccess: (orderId) =>
          set({ lastOrderId: orderId, isCheckingOut: false }),

        /** Clear cart after successful order */
        clearCart: () =>
          set({
            items: [],
            subtotal: 0,
            tax: 0,
            total: 0,
            discount: 0,
            customer: null,
            note: "",
            isCheckingOut: false,
          }),

        /** Recalculate totals (called after hydration) */
        recalculate: () => {
          const { items } = get();
          set(calcTotals(items));
        },
      }),
      {
        name: "pos-cart",
        // Only persist items + customer; recalculate totals on hydration
        partialize: (state) => ({
          items: state.items,
          customer: state.customer,
          note: state.note,
          discount: state.discount,
        }),
        onRehydrateStorage: () => (state) => {
          state?.recalculate();
        },
      }
    )
  )
);