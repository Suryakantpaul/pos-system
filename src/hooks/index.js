/**
 * hooks/index.js
 * ─────────────────────────────────────────────────────────────────
 * Shared custom hooks for the POS system
 * ─────────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useCallback, useRef, useMemo } from "react";

// ─── useDebounce ─────────────────────────────────────────────────

/**
 * Debounce a value by `delay` ms.
 * Use for search inputs to avoid hammering the API.
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// ─── useOnlineStatus ─────────────────────────────────────────────

/**
 * Tracks browser online/offline status.
 * Fires `onReconnect` callback when connection is restored.
 */
export function useOnlineStatus(onReconnect) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const onReconnectRef = useRef(onReconnect);

  useEffect(() => {
    onReconnectRef.current = onReconnect;
  });

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      onReconnectRef.current?.();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}

// ─── useKeyboardShortcuts ────────────────────────────────────────

/**
 * Register global keyboard shortcuts.
 *
 * shortcuts: { [key]: handler }
 * e.g. { "F2": () => focusSearch(), "Escape": () => closeModal() }
 *
 * Modifier support: "ctrl+k", "alt+Enter", "shift+Delete"
 */
export function useKeyboardShortcuts(shortcuts, enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const handler = (e) => {
      const parts = [];
      if (e.ctrlKey || e.metaKey) parts.push("ctrl");
      if (e.altKey) parts.push("alt");
      if (e.shiftKey) parts.push("shift");
      parts.push(e.key);

      const combo = parts.join("+").toLowerCase();
      const plain = e.key;

      const match = shortcuts[combo] ?? shortcuts[plain];
      if (match) {
        e.preventDefault();
        match(e);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [shortcuts, enabled]);
}

// ─── useLocalStorage ─────────────────────────────────────────────

export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value) => {
      try {
        const v = value instanceof Function ? value(storedValue) : value;
        setStoredValue(v);
        localStorage.setItem(key, JSON.stringify(v));
      } catch (err) {
        console.error("useLocalStorage write error:", err);
      }
    },
    [key, storedValue]
  );

  return [storedValue, setValue];
}

// ─── usePreviousValue ────────────────────────────────────────────

export function usePreviousValue(value) {
  const ref = useRef();
  useEffect(() => { ref.current = value; });
  return ref.current;
}

// ─── useProductSearch ────────────────────────────────────────────

/**
 * Handles debounced product search with loading + error state.
 * Pass `searchFn`: async (query) => products[]
 */
export function useProductSearch(searchFn, delay = 300) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const debouncedQuery = useDebounce(query, delay);
  const abortRef = useRef(null);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      return;
    }

    // Cancel previous request
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setIsLoading(true);
    setError(null);

    searchFn(debouncedQuery, abortRef.current.signal)
      .then((data) => setResults(data ?? []))
      .catch((err) => {
        if (err.name !== "AbortError") setError(err.message);
      })
      .finally(() => setIsLoading(false));
  }, [debouncedQuery]); // eslint-disable-line

  return { query, setQuery, results, isLoading, error };
}

// ─── useCartKeyboard ─────────────────────────────────────────────

/**
 * POS-specific keyboard shortcuts for cart operations.
 * Integrates with cartStore.
 */
export function useCartKeyboard({ onCheckout, onClear, onFocusSearch }) {
  const shortcuts = useMemo(
    () => ({
      F2: onFocusSearch,
      F12: onCheckout,
      "ctrl+delete": onClear,
      Escape: onFocusSearch,
    }),
    [onCheckout, onClear, onFocusSearch]
  );

  useKeyboardShortcuts(shortcuts);
}
