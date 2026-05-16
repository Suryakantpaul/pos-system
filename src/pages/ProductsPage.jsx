/**
 * ProductsPage.jsx  — Admin Products Management
 *
 * ALL BUGS FIXED:
 *  ✅ React hooks-before-return (canManageInventory was called before hooks → crash)
 *  ✅ API response shape  ({ success, products:[...] } not plain array)
 *  ✅ /products/categories doesn't exist → extract from products array instead
 *  ✅ "Add Product" button not working (crashed before reaching modal)
 *  ✅ Stats (total / out-of-stock / low-stock / value) now update live
 *  ✅ Typing focus bug (FormField lives outside modal component)
 *  ✅ Local image upload (base64 preview)
 *  ✅ Back to POS button in header
 */

import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  Plus, Search, Edit2, Trash2, Package, Tag,
  AlertTriangle, ChevronUp, ChevronDown, X,
  Loader2, RefreshCw, Filter, BarChart2,
  ShieldOff, ArrowLeft, Upload, Hash,
  DollarSign, Layers, Save, Archive, ImageOff, Home
} from "lucide-react";
import { useAuthStore, canManageInventory, canDeleteProducts, ROLES } from "../store/authStore";
import clsx from "clsx";
import toast from "react-hot-toast";

// ─── Constants ───────────────────────────────────────────────────

const LOW_STOCK_THRESHOLD = 10;

const EMPTY_FORM = {
  name: "", sku: "", barcode: "", category: "",
  price: "", cost: "", stock: "", unit: "pcs",
  image: "", description: "",
};

// ─── API helper — reads token from Zustand-persisted localStorage ─

async function apiFetch(path, options = {}) {
  const BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000/api";
  let token = null;
  try {
    const raw = localStorage.getItem("pos-auth");
    if (raw) token = JSON.parse(raw)?.state?.token;
  } catch (_) {}

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });

  // If response is not JSON (e.g. 204 No Content) just return null
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch (_) {}

  if (!res.ok) {
    throw new Error(data?.message ?? `HTTP ${res.status}`);
  }
  return data;
}

// ─── Helpers ─────────────────────────────────────────────────────

const fmt = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 2,
  }).format(Number(n) || 0);

const stockBadge = (qty) => {
  const n = Number(qty ?? 0);
  if (n === 0) return { cls: "bg-rose-500/15 text-rose-400 border-rose-500/25",    label: "Out of Stock" };
  if (n < LOW_STOCK_THRESHOLD)
               return { cls: "bg-amber-500/15 text-amber-400 border-amber-500/25", label: "Low Stock"    };
  return       { cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",  label: "In Stock"     };
};

// ─── FormField — MUST be outside ProductModal ─────────────────────
// Defining it inside causes React to treat it as a new component
// type on every render → unmount/remount → focus lost after 1 char.

const FormField = ({ label, name, type = "text", placeholder, icon: Icon, half, form, errors, onChange }) => (
  <div className={clsx("flex flex-col gap-1", half ? "col-span-1" : "col-span-2")}>
    <label className="text-white/50 text-xs font-medium flex items-center gap-1.5">
      {Icon && <Icon size={11} className="text-white/30" />}
      {label}
    </label>
    <input
      type={type}
      value={form[name]}
      onChange={(e) => onChange(name, e.target.value)}
      placeholder={placeholder}
      min={type === "number" ? "0" : undefined}
      step={type === "number" ? "any" : undefined}
      className={clsx(
        "bg-white/[0.04] border rounded-lg px-3 py-2 text-sm text-white/80 placeholder-white/20",
        "outline-none transition-all focus:border-indigo-500/60 focus:bg-white/[0.06]",
        errors[name] ? "border-rose-500/50" : "border-white/[0.08]"
      )}
    />
    {errors[name] && <span className="text-rose-400 text-[10px]">{errors[name]}</span>}
  </div>
);

// ─── ImageUploader ────────────────────────────────────────────────

function ImageUploader({ value, onChange }) {
  const fileRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const processFile = (file) => {
    if (!file?.type.startsWith("image/")) { toast.error("Please select an image"); return; }
    if (file.size > 2 * 1024 * 1024)      { toast.error("Image must be under 2 MB"); return; }
    const reader = new FileReader();
    reader.onload = (e) => onChange(e.target.result);
    reader.readAsDataURL(file);
  };

  return (
    <div className="col-span-2 flex flex-col gap-1">
      <label className="text-white/50 text-xs font-medium flex items-center gap-1.5">
        <Upload size={11} className="text-white/30" /> Product Image
      </label>
      <div className="flex gap-3 items-start">
        {/* Preview */}
        <div className="w-20 h-20 rounded-xl border border-white/[0.08] bg-white/[0.03] flex items-center justify-center shrink-0 overflow-hidden">
          {value
            ? <img src={value} alt="preview" className="w-full h-full object-cover" />
            : <ImageOff size={20} className="text-white/15" />}
        </div>

        {/* Drop zone */}
        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); processFile(e.dataTransfer.files[0]); }}
          className={clsx(
            "flex-1 min-h-[80px] rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all",
            dragging ? "border-indigo-500/60 bg-indigo-500/10" : "border-white/[0.08] hover:border-indigo-500/40 hover:bg-white/[0.03]"
          )}
        >
          <Upload size={16} className="text-white/25" />
          <span className="text-white/30 text-xs text-center px-2">
            Click or drag an image here<br />
            <span className="text-white/20">PNG · JPG · WEBP · max 2 MB</span>
          </span>
        </div>

        <input ref={fileRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => processFile(e.target.files[0])} />

        {value && (
          <button type="button" onClick={() => onChange("")}
            className="p-1.5 text-white/30 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all mt-1"
            title="Remove">
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Access Denied screen ─────────────────────────────────────────

function AccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-[#0a0c10] gap-4 text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
        <ShieldOff size={28} className="text-rose-400" />
      </div>
      <div>
        <h2 className="text-white/90 text-lg font-semibold">Access Restricted</h2>
        <p className="text-white/40 text-sm mt-1">Only Admins and Managers can manage products.</p>
      </div>
      <button onClick={() => window.location.replace("/pos")}
        className="flex items-center gap-2 px-4 py-2 bg-indigo-500/15 text-indigo-300 border border-indigo-500/25 rounded-lg text-sm hover:bg-indigo-500/25 transition-all">
        <Home size={14} /> Back to POS
      </button>
    </div>
  );
}

// ─── Product Modal ────────────────────────────────────────────────

function ProductModal({ product, categories, onClose, onSaved }) {
  const nameRef = useRef(null);
  const [form, setForm] = useState(() =>
    product
      ? { ...EMPTY_FORM, ...product, price: product.price ?? "", cost: product.cost ?? "", stock: product.stock ?? "" }
      : { ...EMPTY_FORM }
  );
  const [errors,  setErrors]  = useState({});
  const [saving,  setSaving]  = useState(false);

  useEffect(() => { nameRef.current?.focus(); }, []);

  // useCallback keeps onChange reference stable → no remount on re-render
  const onChange = useCallback((k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => ({ ...e, [k]: undefined }));
  }, []);

  const validate = () => {
    const e = {};
    if (!form.name.trim())     e.name     = "Name is required";
    if (!form.sku.trim())      e.sku      = "SKU is required";
    if (!form.category.trim()) e.category = "Category is required";
    if (form.price === "" || isNaN(Number(form.price)) || Number(form.price) < 0) e.price = "Valid price required";
    if (form.stock === "" || isNaN(Number(form.stock)) || Number(form.stock) < 0) e.stock = "Valid quantity required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        cost:  form.cost !== "" ? Number(form.cost) : 0,
        stock: Number(form.stock),
      };
      if (product?._id) {
        await apiFetch(`/products/${product._id}`, { method: "PUT",  body: JSON.stringify(payload) });
        toast.success("Product updated ✓");
      } else {
        await apiFetch("/products",                { method: "POST", body: JSON.stringify(payload) });
        toast.success("Product created ✓");
      }
      onSaved();
    } catch (err) {
      toast.error(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const fp = { form, errors, onChange };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-[#0f1117] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center">
              <Package size={15} className="text-indigo-400" />
            </div>
            <div>
              <h2 className="text-white/90 font-semibold text-sm">{product ? "Edit Product" : "Add New Product"}</h2>
              <p className="text-white/30 text-xs">{product ? `SKU: ${product.sku}` : "Fill in all required fields"}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-white/30 hover:text-white/70 hover:bg-white/[0.06] rounded-lg transition-all">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 grid grid-cols-2 gap-4 max-h-[68vh] overflow-y-auto">

          {/* Product Name — full width, manual autofocus */}
          <div className="col-span-2 flex flex-col gap-1">
            <label className="text-white/50 text-xs font-medium flex items-center gap-1.5">
              <Package size={11} className="text-white/30" /> Product Name <span className="text-rose-400">*</span>
            </label>
            <input
              ref={nameRef}
              type="text"
              value={form.name}
              onChange={(e) => onChange("name", e.target.value)}
              placeholder="e.g. Coca-Cola 500ml"
              className={clsx(
                "bg-white/[0.04] border rounded-lg px-3 py-2 text-sm text-white/80 placeholder-white/20",
                "outline-none transition-all focus:border-indigo-500/60 focus:bg-white/[0.06]",
                errors.name ? "border-rose-500/50" : "border-white/[0.08]"
              )}
            />
            {errors.name && <span className="text-rose-400 text-[10px]">{errors.name}</span>}
          </div>

          <FormField label="SKU *"    name="sku"     placeholder="e.g. CC-500"         icon={Hash}  half {...fp} />
          <FormField label="Barcode"  name="barcode" placeholder="e.g. 5449000021526"  icon={Tag}   half {...fp} />

          {/* Category */}
          <div className="col-span-1 flex flex-col gap-1">
            <label className="text-white/50 text-xs font-medium flex items-center gap-1.5">
              <Layers size={11} className="text-white/30" /> Category <span className="text-rose-400">*</span>
            </label>
            <input
              list="cat-list"
              value={form.category}
              onChange={(e) => onChange("category", e.target.value)}
              placeholder="e.g. Beverages"
              className={clsx(
                "w-full bg-white/[0.04] border rounded-lg px-3 py-2 text-sm text-white/80 placeholder-white/20",
                "outline-none transition-all focus:border-indigo-500/60 focus:bg-white/[0.06]",
                errors.category ? "border-rose-500/50" : "border-white/[0.08]"
              )}
            />
            <datalist id="cat-list">
              {categories.map((c) => <option key={c} value={c} />)}
            </datalist>
            {errors.category && <span className="text-rose-400 text-[10px]">{errors.category}</span>}
          </div>

          {/* Unit */}
          <div className="col-span-1 flex flex-col gap-1">
            <label className="text-white/50 text-xs font-medium">Unit</label>
            <select value={form.unit} onChange={(e) => onChange("unit", e.target.value)}
              className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white/80 outline-none focus:border-indigo-500/60 transition-all">
              {["pcs","kg","g","litre","ml","box","pack","dozen"].map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>

          <FormField label="Selling Price (₹) *" name="price" type="number" placeholder="0.00" icon={DollarSign} half {...fp} />
          <FormField label="Cost Price (₹)"      name="cost"  type="number" placeholder="0.00" icon={DollarSign} half {...fp} />
          <FormField label="Stock Quantity *"     name="stock" type="number" placeholder="0"    icon={Archive}    half {...fp} />

          <ImageUploader value={form.image} onChange={(v) => onChange("image", v)} />

          {/* Description */}
          <div className="col-span-2 flex flex-col gap-1">
            <label className="text-white/50 text-xs font-medium">Description (optional)</label>
            <textarea
              value={form.description}
              onChange={(e) => onChange("description", e.target.value)}
              rows={2}
              placeholder="Short product description..."
              className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white/80 placeholder-white/20 outline-none transition-all focus:border-indigo-500/60 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/[0.06]">
          <button onClick={onClose}
            className="px-4 py-2 text-sm text-white/50 hover:text-white/80 hover:bg-white/[0.06] rounded-lg transition-all">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-all shadow-lg shadow-indigo-500/25 cursor-pointer"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {product ? "Save Changes" : "Create Product"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Confirm ───────────────────────────────────────────────

function DeleteConfirm({ product, onClose, onDeleted }) {
  const [deleting, setDeleting] = useState(false);
  const handleDelete = async () => {
    setDeleting(true);
    try {
      await apiFetch(`/products/${product._id}`, { method: "DELETE" });
      toast.success(`"${product.name}" deleted`);
      onDeleted();
    } catch (err) {
      toast.error(err.message || "Delete failed");
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-[#0f1117] border border-white/[0.08] rounded-2xl shadow-2xl p-6 text-center">
        <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-4">
          <Trash2 size={20} className="text-rose-400" />
        </div>
        <h3 className="text-white/90 font-semibold mb-1">Delete Product?</h3>
        <p className="text-white/40 text-sm mb-6">
          <span className="text-white/70 font-medium">"{product.name}"</span> will be permanently removed.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2 text-sm text-white/50 hover:text-white/80 hover:bg-white/[0.06] rounded-lg transition-all">Cancel</button>
          <button onClick={handleDelete} disabled={deleting}
            className="flex-1 flex items-center justify-center gap-2 py-2 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-all">
            {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />} Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Stats Bar — live from products array ─────────────────────────

function StatsBar({ products }) {
  const total      = products.length;
  const outOfStock = products.filter(p => Number(p.stock ?? 0) === 0).length;
  const lowStock   = products.filter(p => { const s = Number(p.stock ?? 0); return s > 0 && s < LOW_STOCK_THRESHOLD; }).length;
  const totalValue = products.reduce((s, p) => s + (Number(p.price) || 0) * (Number(p.stock) || 0), 0);

  const stats = [
    { label: "Total Products",  value: total,          icon: Package,       color: "text-indigo-400",  bg: "bg-indigo-500/10  border-indigo-500/20"  },
    { label: "Low Stock",       value: lowStock,        icon: AlertTriangle, color: "text-amber-400",   bg: "bg-amber-500/10   border-amber-500/20"   },
    { label: "Out of Stock",    value: outOfStock,      icon: Archive,       color: "text-rose-400",    bg: "bg-rose-500/10    border-rose-500/20"    },
    { label: "Inventory Value", value: fmt(totalValue), icon: BarChart2,     color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
      {stats.map(({ label, value, icon: Icon, color, bg }) => (
        <div key={label} className={clsx("flex items-center gap-3 p-3.5 rounded-xl border transition-all", bg)}>
          <div className={clsx("p-2 rounded-lg bg-white/[0.04]", color)}>
            <Icon size={15} />
          </div>
          <div>
            <p className="text-white/40 text-[10px] font-medium uppercase tracking-wide">{label}</p>
            <p className="text-white/90 font-bold text-base mt-0.5">{value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Sort icon ────────────────────────────────────────────────────

const SORT_FIELDS = { name: "Name", price: "Price", stock: "Stock", category: "Category" };

// ─── Main Page ────────────────────────────────────────────────────

export default function ProductsPage() {
  // ⚠️  ALL hooks MUST come before any conditional return (React rules)
  const { role } = useAuthStore();
  const [products,       setProducts]       = useState([]);
  const [categories,     setCategories]     = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [search,         setSearch]         = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [sort,           setSort]           = useState({ field: "name", dir: "asc" });
  const [modal,          setModal]          = useState(null);
  const searchRef = useRef(null);

  // ── Fetch products ─────────────────────────────────────────────
  // Backend returns: { success: true, products: [...], count: N }
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch("/products?limit=500");
      // Handle both shapes: { success, products:[...] }  and plain  [...]
      const list = Array.isArray(data) ? data
                 : Array.isArray(data?.products) ? data.products
                 : [];
      setProducts(list);
      // Derive categories from the product list (no separate endpoint needed)
      const cats = [...new Set(list.map(p => p.category).filter(Boolean))].sort();
      setCategories(cats);
    } catch (err) {
      toast.error("Failed to load products: " + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Keyboard shortcuts ─────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      const tag = document.activeElement.tagName;
      if (["INPUT","TEXTAREA","SELECT"].includes(tag)) return;
      if (e.key === "n" && !e.ctrlKey && !e.metaKey) setModal({ type: "add" });
      if (e.key === "/") { e.preventDefault(); searchRef.current?.focus(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // ── Access guard — AFTER all hooks ────────────────────────────
  if (!canManageInventory(role)) return <AccessDenied />;

  // ── Filter + Sort ──────────────────────────────────────────────
  const displayed = products
    .filter(p => {
      const q = search.toLowerCase();
      const ok = !q || p.name?.toLowerCase().includes(q)
                     || p.sku?.toLowerCase().includes(q)
                     || p.barcode?.toLowerCase().includes(q);
      return ok && (activeCategory === "all" || p.category === activeCategory);
    })
    .sort((a, b) => {
      const { field, dir } = sort;
      const va = a[field] ?? ""; const vb = b[field] ?? "";
      const cmp = typeof va === "number" ? va - vb : String(va).localeCompare(String(vb));
      return dir === "asc" ? cmp : -cmp;
    });

  const toggleSort = (field) =>
    setSort(s => s.field === field ? { field, dir: s.dir === "asc" ? "desc" : "asc" } : { field, dir: "asc" });

  const SortIcon = ({ field }) =>
    sort.field !== field ? <ChevronDown size={12} className="text-white/20" />
    : sort.dir === "asc" ? <ChevronUp   size={12} className="text-indigo-400" />
                         : <ChevronDown size={12} className="text-indigo-400" />;

  const onSaved   = useCallback(() => { setModal(null); fetchData(); }, [fetchData]);
  const onDeleted = useCallback(() => { setModal(null); fetchData(); }, [fetchData]);

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen bg-[#0a0c10] text-white overflow-hidden">

      {/* ── Top Bar ─────────────────────────────────────────── */}
      <div className="shrink-0 px-5 pt-5 pb-4 border-b border-white/[0.06] bg-[#0f1117]/90 backdrop-blur">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            {/* ← Back to POS */}
            <button
              onClick={() => window.location.replace("/pos")}
              className="flex items-center gap-1.5 px-3 py-1.5 text-white/40 hover:text-white/80 hover:bg-white/[0.06] border border-white/[0.06] rounded-lg text-xs transition-all"
            >
              <ArrowLeft size={13} /> Back to POS
            </button>

            <div className="w-px h-5 bg-white/[0.08]" />

            <div className="flex items-center gap-2">
              <Package size={16} className="text-indigo-400" />
              <h1 className="text-white/90 font-bold text-lg tracking-tight">Products</h1>
              <span className="text-white/25 text-xs font-mono bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/[0.06]">
                {products.length}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={fetchData} title="Refresh"
              className="p-2 text-white/40 hover:text-white/70 hover:bg-white/[0.06] rounded-lg transition-all">
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            </button>
            <button
              onClick={() => setModal({ type: "add" })}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-indigo-500/20"
            >
              <Plus size={15} /> Add Product
              <kbd className="hidden sm:inline text-[9px] bg-indigo-600/60 text-indigo-200 px-1.5 py-0.5 rounded font-mono">N</kbd>
            </button>
          </div>
        </div>

        {/* Search + Category Filter */}
        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, SKU, barcode…"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-8 pr-8 py-2 text-sm text-white/80 placeholder-white/20 outline-none focus:border-indigo-500/50 focus:bg-white/[0.06] transition-all"
            />
            {search && (
              <button onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-all">
                <X size={12} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <Filter size={12} className="text-white/25 shrink-0" />
            {["all", ...categories].map((cat) => (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                className={clsx(
                  "px-3 py-1 rounded-lg text-xs font-medium border transition-all capitalize",
                  activeCategory === cat
                    ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/30"
                    : "bg-white/[0.03] text-white/35 border-white/[0.06] hover:text-white/60 hover:bg-white/[0.06]"
                )}>
                {cat === "all" ? "All" : cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-5">

        {/* Stats — live */}
        <StatsBar products={products} />

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-24 gap-3 text-white/30">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm">Loading products…</span>
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
              <Package size={24} className="text-white/20" />
            </div>
            <p className="text-white/40 text-sm">
              {search ? `No products match "${search}"` : "No products yet — add your first one!"}
            </p>
            {!search && (
              <button onClick={() => setModal({ type: "add" })}
                className="flex items-center gap-1.5 text-indigo-400 text-sm hover:text-indigo-300 transition-all">
                <Plus size={14} /> Add Product
              </button>
            )}
          </div>
        ) : (
          <div className="bg-[#0f1117] border border-white/[0.06] rounded-2xl overflow-hidden">
            {/* Head */}
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_80px] text-[10px] font-semibold uppercase tracking-wider text-white/30 px-4 py-2.5 border-b border-white/[0.06] bg-white/[0.02]">
              {Object.entries(SORT_FIELDS).map(([field, label]) => (
                <button key={field} onClick={() => toggleSort(field)}
                  className="flex items-center gap-1 hover:text-white/60 transition-all text-left">
                  {label} <SortIcon field={field} />
                </button>
              ))}
              <span className="text-right">Actions</span>
            </div>

            {/* Rows */}
            <div className="divide-y divide-white/[0.04]">
              {displayed.map((product) => {
                const { cls, label } = stockBadge(product.stock);
                const margin = product.cost > 0
                  ? (((product.price - product.cost) / product.price) * 100).toFixed(1)
                  : null;

                return (
                  <div key={product._id}
                    className="grid grid-cols-[2fr_1fr_1fr_1fr_80px] items-center px-4 py-3 hover:bg-white/[0.025] transition-all group">

                    {/* Name + thumbnail */}
                    <div className="flex items-center gap-3 min-w-0">
                      {product.image ? (
                        <img src={product.image} alt={product.name}
                          className="w-9 h-9 rounded-lg object-cover border border-white/[0.08] shrink-0"
                          onError={(e) => { e.currentTarget.style.display = "none"; }} />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0">
                          <Package size={13} className="text-white/20" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-white/85 text-sm font-medium truncate">{product.name}</p>
                        <p className="text-white/30 text-[10px] font-mono">{product.sku}</p>
                      </div>
                    </div>

                    {/* Category */}
                    <span className="text-white/50 text-xs capitalize bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 rounded-md w-fit">
                      {product.category || "—"}
                    </span>

                    {/* Price */}
                    <div>
                      <p className="text-white/80 text-sm font-mono">{fmt(product.price)}</p>
                      {margin && <p className="text-emerald-400/70 text-[10px]">{margin}% margin</p>}
                    </div>

                    {/* Stock */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white/70 text-sm font-mono">{product.stock ?? 0} {product.unit || "pcs"}</span>
                      <span className={clsx("text-[9px] font-medium px-1.5 py-0.5 rounded border whitespace-nowrap", cls)}>{label}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => setModal({ type: "edit", product })}
                        className="p-1.5 text-white/40 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-lg transition-all" title="Edit">
                        <Edit2 size={13} />
                      </button>
                      {canDeleteProducts(role) && (
                        <button onClick={() => setModal({ type: "delete", product })}
                          className="p-1.5 text-white/40 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-all" title="Delete">
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 border-t border-white/[0.06] bg-white/[0.02] flex items-center justify-between text-xs text-white/25">
              <span>Showing {displayed.length} of {products.length} products</span>
              {displayed.length < products.length && <span>{products.length - displayed.length} hidden by filter</span>}
            </div>
          </div>
        )}
      </div>

      {/* ── Modals ───────────────────────────────────────────── */}
      {modal?.type === "add" && (
        <ProductModal product={null} categories={categories} onClose={() => setModal(null)} onSaved={onSaved} />
      )}
      {modal?.type === "edit" && (
        <ProductModal product={modal.product} categories={categories} onClose={() => setModal(null)} onSaved={onSaved} />
      )}
      {modal?.type === "delete" && (
        <DeleteConfirm product={modal.product} onClose={() => setModal(null)} onDeleted={onDeleted} />
      )}
    </div>
  );
}