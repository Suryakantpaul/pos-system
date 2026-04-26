/**
 * POSPage.jsx
 * ─────────────────────────────────────────────────────────────────
 * Main POS page — wires together all components.
 * Layout: [Navbar] | [Search + ProductList] | [CartPanel]
 * ─────────────────────────────────────────────────────────────────
 */

import React, { useState, useCallback, useEffect, useRef } from "react";
import toast from "react-hot-toast";

import Navbar from "../components/Navbar";
import ProductSearchBar from "../components/ProductSearchBar";
import ProductList from "../components/ProductList";
import CartPanel from "../components/CartPanel";
import CheckoutPanel from "../components/CheckoutPanel";
import OrderSuccessModal from "../components/OrderSuccessModal";
import LoadingSpinner from "../components/LoadingSpinner";

import { useCartStore } from "../store/cartStore";
import { useProductStore } from "../store/productStore";
import { useDebounce, useOnlineStatus, useCartKeyboard } from "../hooks";
import { productApi, orderApi } from "../services/api";
import { parseApiError, isBarcode } from "../utils";

// ─── Mock data (replace with real API in production) ─────────────

const MOCK_CATEGORIES = ["electronics", "grocery", "clothing", "beverages", "stationery"];

const MOCK_PRODUCTS = [
  { _id: "p1",  name: "Wireless Earbuds Pro",   sku: "ELEC-001", price: 79.99,  stock: 15,  category: "electronics", imageUrl: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=300&q=80" },
  { _id: "p2",  name: "USB-C Hub 7-in-1",       sku: "ELEC-002", price: 34.99,  stock: 8,   category: "electronics", imageUrl: "https://images.unsplash.com/photo-1625895197185-efcec01cffe0?w=300&q=80" },
  { _id: "p3",  name: "Mechanical Keyboard",    sku: "ELEC-003", price: 129.00, stock: 3,   category: "electronics", imageUrl: "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=300&q=80" },
  { _id: "p4",  name: "Organic Green Tea",      sku: "BEV-001",  price: 5.49,   stock: 100, category: "beverages",   imageUrl: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=300&q=80" },
  { _id: "p5",  name: "Cold Brew Coffee 500ml", sku: "BEV-002",  price: 4.99,   stock: 24,  category: "beverages",   imageUrl: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=300&q=80" },
  { _id: "p6",  name: "Sparkling Water Pack",   sku: "BEV-003",  price: 3.29,   stock: 60,  category: "beverages",   imageUrl: "https://images.unsplash.com/photo-1564419320461-6870880221ad?w=300&q=80" },
  { _id: "p7",  name: "Whole Wheat Bread",      sku: "GRO-001",  price: 2.99,   stock: 18,  category: "grocery",     imageUrl: "https://images.unsplash.com/photo-1549931319-a545dcf3bc7b?w=300&q=80" },
  { _id: "p8",  name: "Organic Almond Milk",    sku: "GRO-002",  price: 4.49,   stock: 12,  category: "grocery",     imageUrl: "https://images.unsplash.com/photo-1600718374662-0483d2b9da44?w=300&q=80" },
  { _id: "p9",  name: "Greek Yogurt 200g",      sku: "GRO-003",  price: 1.89,   stock: 30,  category: "grocery",     imageUrl: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=300&q=80" },
  { _id: "p10", name: "Slim Fit Chinos",        sku: "CLO-001",  price: 49.99,  stock: 7,   category: "clothing",    imageUrl: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=300&q=80" },
  { _id: "p11", name: "Cotton Crew Tee",        sku: "CLO-002",  price: 19.99,  stock: 0,   category: "clothing",    imageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&q=80" },
  { _id: "p12", name: "Notebook A5 80pg",       sku: "STN-001",  price: 3.49,   stock: 50,  category: "stationery",  imageUrl: "https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=300&q=80" },
  { _id: "p13", name: "Gel Pen Set 12pc",       sku: "STN-002",  price: 6.99,   stock: 40,  category: "stationery",  imageUrl: "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=300&q=80" },
  { _id: "p14", name: "Sticky Notes Bundle",    sku: "STN-003",  price: 2.49,   stock: 80,  category: "stationery",  imageUrl: "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=300&q=80" },
  { _id: "p15", name: "Bluetooth Speaker",      sku: "ELEC-004", price: 59.99,  stock: 6,   category: "electronics", imageUrl: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=300&q=80" },
  { _id: "p16", name: "Protein Bar Choco",      sku: "GRO-004",  price: 2.29,   stock: 45,  category: "grocery",     imageUrl: "https://images.unsplash.com/photo-1622484212850-eb596d769edc?w=300&q=80" },
];

// ─── POSPage ──────────────────────────────────────────────────────

export default function POSPage() {
  const searchInputRef = useRef(null);

  // Store state
  const {
    products, searchResults, query, isLoading, error, categories, activeCategory,
    setQuery, setLoading, setError, setProducts, setSearchResults,
    setCategories, setActiveCategory,
  } = useProductStore();

  const cartItems = useCartStore((s) => s.items);

  // Local UI state
  const [showCheckout, setShowCheckout] = useState(false);
  const [successOrder, setSuccessOrder] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Debounced query
  const debouncedQuery = useDebounce(query, 280);

  // ── Online/Offline sync ──────────────────────────────────────
  const isOnline = useOnlineStatus(async () => {
    try {
      setIsSyncing(true);
      const { synced, failed } = await orderApi.syncOfflineQueue();
      if (synced > 0) toast.success(`${synced} offline order${synced > 1 ? "s" : ""} synced.`);
      if (failed > 0) toast.error(`${failed} order${failed > 1 ? "s" : ""} failed to sync.`);
    } catch (_) {
      // silence
    } finally {
      setIsSyncing(false);
    }
  });

  // ── Initial product load ─────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        // In production: const res = await productApi.list(1, 50);
        // Using mock data for demo:
        await new Promise((r) => setTimeout(r, 600)); // simulate network
        setProducts(MOCK_PRODUCTS);
        setCategories(MOCK_CATEGORIES);
      } catch (err) {
        setError(parseApiError(err));
        toast.error("Failed to load products.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []); // eslint-disable-line

  // ── Debounced search ─────────────────────────────────────────
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setSearchResults(products);
      return;
    }

    const barcode = isBarcode(debouncedQuery);
    if (barcode) {
      // Simulate barcode lookup
      const found = products.filter((p) => p.sku === debouncedQuery || p._id === debouncedQuery);
      setSearchResults(found);
      if (found.length === 0) toast("No product found for that barcode.", { icon: "📦" });
      return;
    }

    const q = debouncedQuery.toLowerCase();
    const filtered = products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q)
    );
    setSearchResults(filtered);
  }, [debouncedQuery, products]); // eslint-disable-line

  // ── Keyboard shortcuts ───────────────────────────────────────
  const focusSearch = useCallback(() => {
    searchInputRef.current?.querySelector("input")?.focus();
  }, []);

  useCartKeyboard({
    onCheckout: () => cartItems.length > 0 && setShowCheckout(true),
    onClear: () => useCartStore.getState().clearCart(),
    onFocusSearch: focusSearch,
  });

  // ── Handlers ─────────────────────────────────────────────────
  const handleOrderSuccess = useCallback((order) => {
    setShowCheckout(false);
    setSuccessOrder(order);
  }, []);

  const handleNewOrder = useCallback(() => {
    setSuccessOrder(null);
  }, []);

  const displayedProducts =
    debouncedQuery.trim() ? searchResults : products;

  return (
    <div className="flex flex-col h-screen bg-[#0a0c10] overflow-hidden font-['DM_Sans']">
      {/* Navbar */}
      <Navbar />

      {/* Sync indicator */}
      {isSyncing && (
        <div className="h-0.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500 animate-pulse" />
      )}

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Products */}
        <div className="flex flex-col flex-1 overflow-hidden p-4 gap-3 min-w-0">
          {/* Search */}
          <div ref={searchInputRef}>
            <ProductSearchBar
              value={query}
              onChange={setQuery}
              onSearch={(q, isBC) => {
                if (isBC) toast(`Scanning barcode: ${q}`, { icon: "📷" });
              }}
              isLoading={isLoading}
              autoFocus
            />
          </div>

          {/* Result count */}
          {debouncedQuery && (
            <p className="text-white/25 text-xs">
              {displayedProducts.length} result{displayedProducts.length !== 1 ? "s" : ""} for "{debouncedQuery}"
            </p>
          )}

          {/* Product Grid */}
          <ProductList
            products={displayedProducts}
            categories={categories}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            isLoading={isLoading}
            error={error}
            query={query}
          />
        </div>

        {/* Right: Cart */}
        <div className="w-72 xl:w-80 shrink-0 hidden md:flex flex-col h-full overflow-hidden">
          <CartPanel onCheckout={() => setShowCheckout(true)} />
        </div>
      </div>

      {/* Mobile checkout FAB */}
      {cartItems.length > 0 && (
        <div className="md:hidden fixed bottom-4 right-4 z-40">
          <button
            onClick={() => setShowCheckout(true)}
            className="h-14 px-5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold rounded-2xl shadow-xl shadow-indigo-500/30 flex items-center gap-2.5 active:scale-95 transition-all"
          >
            <span className="text-lg">{cartItems.reduce((a, i) => a + i.quantity, 0)}</span>
            <span>Checkout</span>
          </button>
        </div>
      )}

      {/* Modals */}
      {showCheckout && (
        <CheckoutPanel
          onClose={() => setShowCheckout(false)}
          onSuccess={handleOrderSuccess}
        />
      )}

      {successOrder && (
        <OrderSuccessModal
          order={successOrder}
          onClose={() => setSuccessOrder(null)}
          onNewOrder={handleNewOrder}
        />
      )}
    </div>
  );
}

