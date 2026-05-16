/**
 * api.js
 * ─────────────────────────────────────────────────────────────────
 * Centralized Axios API service with:
 *  - Auth interceptors (Bearer token)
 *  - Request/response logging
 *  - Retry logic (3 attempts on network errors)
 *  - Offline queue
 * ─────────────────────────────────────────────────────────────────
 */

import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000/api";

// ─── Axios Instance ──────────────────────────────────────────────

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// ─── Request Interceptor ─────────────────────────────────────────

api.interceptors.request.use(
  (config) => {
    const raw = localStorage.getItem("pos-auth");
    if (raw) {
      try {
        const { state } = JSON.parse(raw);
        if (state?.token) {
          config.headers.Authorization = `Bearer ${state.token}`;
        }
      } catch (_) {/* ignore */}
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor ────────────────────────────────────────

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;

    config._retryCount = config._retryCount ?? 0;
    if (!response && config._retryCount < 3) {
      config._retryCount += 1;
      const delay = 1000 * config._retryCount;
      await new Promise((res) => setTimeout(res, delay));
      return api(config);
    }

    if (response?.status === 401) {
      localStorage.removeItem("pos-auth");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

// ─── Offline Queue ───────────────────────────────────────────────

const OFFLINE_QUEUE_KEY = "pos-offline-queue";

export const offlineQueue = {
  add: (payload) => {
    const queue = offlineQueue.get();
    queue.push({ ...payload, _timestamp: Date.now() });
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  },
  get: () => {
    try {
      return JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) ?? "[]");
    } catch {
      return [];
    }
  },
  clear: () => localStorage.removeItem(OFFLINE_QUEUE_KEY),
  remove: (index) => {
    const queue = offlineQueue.get();
    queue.splice(index, 1);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  },
};

// ─── Product Endpoints ───────────────────────────────────────────

export const productApi = {
  /** Search products by query (name / SKU / barcode) */
  search: (query, params = {}) =>
    api.get("/products", { params: { q: query, ...params } }),

  /** Get single product by ID */
  getById: (id) => api.get(`/products/${id}`),

  /** Get by barcode */
  getByBarcode: (barcode) => api.get(`/products/barcode/${barcode}`),

  /** Get all categories */
  getCategories: () => api.get("/products/categories"),

  /** Get paginated product list */
  list: (page = 1, limit = 20, category = "") =>
    api.get("/products", { params: { page, limit, category } }),

  // ── Admin CRUD ────────────────────────────────────────

  /** Create a new product (admin / manager) */
  create: (payload) => api.post("/products", payload),

  /** Update a product by ID (admin / manager) */
  update: (id, payload) => api.put(`/products/${id}`, payload),

  /** Delete a product by ID (admin only) */
  delete: (id) => api.delete(`/products/${id}`),
};

// ─── Order Endpoints ─────────────────────────────────────────────

export const orderApi = {
  /** Create a new order */
  create: async (orderPayload) => {
    if (!navigator.onLine) {
      offlineQueue.add(orderPayload);
      return { data: { _id: `offline_${Date.now()}`, offline: true } };
    }
    return api.post("/orders", orderPayload);
  },

  /** Get order by ID */
  getById: (id) => api.get(`/orders/${id}`),

  /** List orders with filters */
  list: (params = {}) => api.get("/orders", { params }),

  /** Sync offline queue */
  syncOfflineQueue: async () => {
    const queue = offlineQueue.get();
    if (!queue.length || !navigator.onLine) return { synced: 0, failed: 0 };

    let synced = 0;
    let failed = 0;

    for (let i = queue.length - 1; i >= 0; i--) {
      try {
        const { _timestamp, ...payload } = queue[i];
        await api.post("/orders", payload);
        offlineQueue.remove(i);
        synced++;
      } catch {
        failed++;
      }
    }

    return { synced, failed };
  },
};

// ─── Auth Endpoints ──────────────────────────────────────────────

export const authApi = {
  login: (credentials) => api.post("/auth/login", credentials),
  logout: () => api.post("/auth/logout"),
  me: () => api.get("/auth/me"),
};

export default api;