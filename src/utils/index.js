/**
 * utils/index.js
 * Shared utilities for the POS system
 */

/** Format a number as currency */
export const formatCurrency = (amount, currency = "USD", locale = "en-US") =>
  new Intl.NumberFormat(locale, { style: "currency", currency }).format(
    amount ?? 0
  );

/** Format date/time */
export const formatDateTime = (date, locale = "en-US") =>
  new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));

/** Generate a random receipt/order number */
export const generateReceiptNumber = () =>
  `RCP-${Date.now().toString(36).toUpperCase()}-${Math.random()
    .toString(36)
    .substring(2, 6)
    .toUpperCase()}`;

/** Clamp a number between min and max */
export const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

/** Truncate text */
export const truncate = (str, len = 30) =>
  str.length > len ? `${str.substring(0, len)}…` : str;

/** Check if a string looks like a barcode (all digits, 8-14 chars) */
export const isBarcode = (str) => /^\d{8,14}$/.test(str.trim());

/** Debounce helper (non-hook version for non-React contexts) */
export const debounce = (fn, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

/** Build order payload from cart state */
export const buildOrderPayload = (cartState, paymentMethod = "cash") => {
  const { items, subtotal, tax, total, discount, customer, note } = cartState;
  return {
    items: items.map((i) => ({
      productId: i.productId,
      name: i.name,
      quantity: i.quantity,
      price: i.price,
      discount: i.discount,
      lineTotal: (i.price - i.discount) * i.quantity,
    })),
    subtotal,
    tax,
    discount,
    total: Math.max(0, total - discount),
    customer: customer ?? null,
    note,
    paymentMethod,
    channel: "pos",
    createdAt: new Date().toISOString(),
  };
};

/** Map API error to user-friendly message */
export const parseApiError = (error) => {
  if (!error) return "An unknown error occurred.";
  if (error.response?.data?.message) return error.response.data.message;
  if (error.message === "Network Error") return "No internet connection.";
  if (error.message?.includes("timeout")) return "Request timed out. Try again.";
  return error.message ?? "Something went wrong.";
};
