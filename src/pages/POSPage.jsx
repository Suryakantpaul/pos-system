/**
 * POSPage.jsx
 * Main POS page — wires together all components.
 */

import React, { useState, useCallback, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { X, Settings } from "lucide-react";

import Navbar from "../components/Navbar";
import ProductSearchBar from "../components/ProductSearchBar";
import ProductList from "../components/ProductList";
import CartPanel from "../components/CartPanel";
import CheckoutPanel from "../components/CheckoutPanel";
import OrderSuccessModal from "../components/OrderSuccessModal";

import { useCartStore } from "../store/cartStore";
import { useProductStore } from "../store/productStore";
import { useDebounce, useOnlineStatus, useCartKeyboard } from "../hooks";
import { orderApi } from "../services/api";
import { isBarcode } from "../utils";
import { useAuthStore } from "../store/authStore";

export default function POSPage() {
  const searchInputRef = useRef(null);

  const {
    products, searchResults, query, isLoading, error, categories, activeCategory,
    setQuery, setLoading, setError, setProducts, setSearchResults,
    setCategories, setActiveCategory,
  } = useProductStore();

  const cartItems = useCartStore((s) => s.items);
  const { logout, user } = useAuthStore();

  const [showCheckout, setShowCheckout] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [successOrder, setSuccessOrder] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const debouncedQuery = useDebounce(query, 280);

  const isOnline = useOnlineStatus(async () => {
    try {
      setIsSyncing(true);
      const { synced, failed } = await orderApi.syncOfflineQueue();
      if (synced > 0) toast.success(`${synced} offline order${synced > 1 ? "s" : ""} synced.`);
      if (failed > 0) toast.error(`${failed} order${failed > 1 ? "s" : ""} failed to sync.`);
    } catch (_) {}
    finally { setIsSyncing(false); }
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = useAuthStore.getState().token;
        const res = await fetch("https://lid-cure-variety.ngrok-free.dev/api/products", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          const cats = [...new Set(data.products.map((p) => p.category))];
          setProducts(data.products);
          setCategories(cats);
        } else {
          throw new Error(data.message);
        }
      } catch (err) {
        setError("Failed to load products.");
        toast.error("Failed to load products.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!debouncedQuery.trim()) { setSearchResults(products); return; }
    const barcode = isBarcode(debouncedQuery);
    if (barcode) {
      const found = products.filter((p) => p.sku === debouncedQuery || p._id === debouncedQuery);
      setSearchResults(found);
      if (found.length === 0) toast("No product found for that barcode.", { icon: "📦" });
      return;
    }
    const q = debouncedQuery.toLowerCase();
    const filtered = products.filter(
      (p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q)
    );
    setSearchResults(filtered);
  }, [debouncedQuery, products]);

  const focusSearch = useCallback(() => {
    searchInputRef.current?.querySelector("input")?.focus();
  }, []);

  useCartKeyboard({
    onCheckout: () => cartItems.length > 0 && setShowCheckout(true),
    onClear: () => useCartStore.getState().clearCart(),
    onFocusSearch: focusSearch,
  });

  const handleOrderSuccess = useCallback((order) => {
    setShowCheckout(false);
    setSuccessOrder(order);
  }, []);

  const handleNewOrder = useCallback(() => { setSuccessOrder(null); }, []);

  const displayedProducts = debouncedQuery.trim() ? searchResults : products;

  return (
    <div className="flex flex-col h-screen bg-[#0a0c10] overflow-hidden font-['DM_Sans']">
      <Navbar
        onOpenReports={() => window.location.href = "/dashboard"}
        onOpenSettings={() => setShowSettings(true)}
      />

      {isSyncing && (
        <div className="h-0.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500 animate-pulse" />
      )}

      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-col flex-1 overflow-hidden p-4 gap-3 min-w-0">
          <div ref={searchInputRef}>
            <ProductSearchBar
              value={query}
              onChange={setQuery}
              onSearch={(q, isBC) => { if (isBC) toast(`Scanning barcode: ${q}`, { icon: "📷" }); }}
              isLoading={isLoading}
              autoFocus
            />
          </div>

          {debouncedQuery && (
            <p className="text-white/25 text-xs">
              {displayedProducts.length} result{displayedProducts.length !== 1 ? "s" : ""} for "{debouncedQuery}"
            </p>
          )}

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

        <div className="w-72 xl:w-80 shrink-0 hidden md:flex flex-col h-full overflow-hidden">
          <CartPanel onCheckout={() => setShowCheckout(true)} />
        </div>
      </div>

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

      {/* ── Settings Modal ─────────────────────────────────── */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#0f1117] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] shrink-0">
              <div className="flex items-center gap-2">
                <Settings size={16} className="text-indigo-400" />
                <h2 className="text-white font-semibold">Settings</h2>
              </div>
              <button onClick={() => setShowSettings(false)} className="p-1.5 text-white/30 hover:text-white/60 hover:bg-white/[0.05] rounded-lg transition-all">
                <X size={16} />
              </button>
            </div>

            <div className="overflow-y-auto p-5 space-y-6">

              {/* Profile */}
              <div>
                <h3 className="text-white/40 text-xs uppercase tracking-widest mb-3">👤 Profile</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-white/50 text-xs mb-1.5 block">Full Name</label>
                    <input defaultValue={user?.name} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500/50 transition-colors" />
                  </div>
                  <div>
                    <label className="text-white/50 text-xs mb-1.5 block">Email</label>
                    <input defaultValue={user?.email} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500/50 transition-colors" />
                  </div>
                  <div>
                    <label className="text-white/50 text-xs mb-1.5 block">New Password</label>
                    <input type="password" placeholder="••••••••" className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500/50 transition-colors placeholder-white/20" />
                  </div>
                  <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-xl transition-all">
                    Update Profile
                  </button>
                </div>
              </div>

              <div className="h-px bg-white/[0.06]" />

              {/* Store Info */}
              <div>
                <h3 className="text-white/40 text-xs uppercase tracking-widest mb-3">🏪 Store Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-white/50 text-xs mb-1.5 block">Store Name</label>
                    <input defaultValue="RetailOS Store" className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500/50 transition-colors" />
                  </div>
                  <div>
                    <label className="text-white/50 text-xs mb-1.5 block">Address</label>
                    <input placeholder="123 Main St, City" className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500/50 transition-colors placeholder-white/20" />
                  </div>
                  <div>
                    <label className="text-white/50 text-xs mb-1.5 block">Phone</label>
                    <input placeholder="+1 234 567 890" className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500/50 transition-colors placeholder-white/20" />
                  </div>
                  <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-xl transition-all">
                    Save Store Info
                  </button>
                </div>
              </div>

              <div className="h-px bg-white/[0.06]" />

              {/* Tax & Currency */}
              <div>
                <h3 className="text-white/40 text-xs uppercase tracking-widest mb-3">💰 Tax & Currency</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-white/[0.03] border border-white/[0.06] rounded-xl">
                    <div>
                      <p className="text-white/80 text-sm font-medium">Tax Rate</p>
                      <p className="text-white/40 text-xs">Applied to all orders</p>
                    </div>
                    <span className="text-indigo-400 font-mono text-sm font-bold">8%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white/[0.03] border border-white/[0.06] rounded-xl">
                    <div>
                      <p className="text-white/80 text-sm font-medium">Currency</p>
                      <p className="text-white/40 text-xs">Display format</p>
                    </div>
                    <span className="text-indigo-400 font-mono text-sm font-bold">USD ($)</span>
                  </div>
                </div>
              </div>

              <div className="h-px bg-white/[0.06]" />

              {/* Receipt */}
              <div>
                <h3 className="text-white/40 text-xs uppercase tracking-widest mb-3">🖨️ Receipt</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-white/50 text-xs mb-1.5 block">Receipt Header</label>
                    <input defaultValue="Thank you for shopping!" className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500/50 transition-colors" />
                  </div>
                  <div>
                    <label className="text-white/50 text-xs mb-1.5 block">Receipt Footer</label>
                    <input defaultValue="Visit us again!" className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500/50 transition-colors" />
                  </div>
                </div>
              </div>

              <div className="h-px bg-white/[0.06]" />

              {/* Notifications */}
              <div>
                <h3 className="text-white/40 text-xs uppercase tracking-widest mb-3">🔔 System</h3>
                <div className="space-y-2">
                  {[
                    { label: "Low Stock Alerts", desc: "Alert when stock below 10", status: "Enabled", color: "emerald" },
                    { label: "Offline Mode", desc: "Queue orders when offline", status: "Enabled", color: "emerald" },
                    { label: "Barcode Scanner", desc: "Press F2 to focus search", status: "Enabled", color: "emerald" },
                    { label: "Redis Caching", desc: "40x faster product loading", status: "Active", color: "indigo" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between p-3 bg-white/[0.03] border border-white/[0.06] rounded-xl">
                      <div>
                        <p className="text-white/80 text-sm font-medium">{item.label}</p>
                        <p className="text-white/40 text-xs">{item.desc}</p>
                      </div>
                      <span className={`text-${item.color}-400 text-xs font-medium`}>{item.status}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="h-px bg-white/[0.06]" />

              {/* Account */}
              <div>
                <h3 className="text-white/40 text-xs uppercase tracking-widest mb-3">⚠️ Account</h3>
                <button
                  onClick={() => { logout(); window.location.href = "/login"; }}
                  className="w-full py-3 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 rounded-xl text-sm font-medium transition-all"
                >
                  Sign Out
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ── Other Modals ───────────────────────────────────── */}
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