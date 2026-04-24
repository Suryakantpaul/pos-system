/**
 * ProductSearchBar.jsx
 * Fast search with debounce, barcode detection, keyboard shortcut (F2)
 */

import React, { useRef, useEffect } from "react";
import { Search, ScanLine, X, Loader2 } from "lucide-react";
import { useKeyboardShortcuts, useDebounce } from "../hooks";
import { isBarcode } from "../utils";
import clsx from "clsx";

export default function ProductSearchBar({
  value,
  onChange,
  onSearch,         // (query, isBarcode) => void — fires on debounce
  isLoading = false,
  placeholder = "Search by name, SKU, or scan barcode… (F2)",
  autoFocus = false,
  className = "",
}) {
  const inputRef = useRef(null);

  // Auto-focus on mount if requested
  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  // F2 / Escape → focus/blur search
  useKeyboardShortcuts({
    F2: () => inputRef.current?.focus(),
    Escape: () => {
      if (document.activeElement === inputRef.current) {
        inputRef.current?.blur();
      }
    },
  });

  const handleChange = (e) => {
    const v = e.target.value;
    onChange(v);
  };

  const handleKeyDown = (e) => {
    // Enter immediately fires search (e.g. after barcode scan)
    if (e.key === "Enter") {
      onSearch?.(value, isBarcode(value));
    }
  };

  const clear = () => {
    onChange("");
    inputRef.current?.focus();
  };

  const barcodeMode = isBarcode(value);

  return (
    <div className={clsx("relative group", className)}>
      {/* Icon */}
      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-indigo-400 transition-colors pointer-events-none">
        {barcodeMode ? (
          <ScanLine size={17} className="text-amber-400" />
        ) : isLoading ? (
          <Loader2 size={17} className="animate-spin text-indigo-400" />
        ) : (
          <Search size={17} />
        )}
      </div>

      {/* Input */}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={clsx(
          "w-full h-11 bg-white/[0.04] border rounded-xl pl-10 pr-10",
          "text-white placeholder:text-white/25 text-sm",
          "transition-all outline-none",
          barcodeMode
            ? "border-amber-500/40 ring-1 ring-amber-500/20 bg-amber-500/5"
            : "border-white/10 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 focus:bg-white/[0.06]"
        )}
      />

      {/* Barcode badge */}
      {barcodeMode && (
        <div className="absolute right-9 top-1/2 -translate-y-1/2 text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-medium border border-amber-500/30">
          BARCODE
        </div>
      )}

      {/* Clear button */}
      {value && !barcodeMode && (
        <button
          onClick={clear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors"
          tabIndex={-1}
        >
          <X size={15} />
        </button>
      )}
    </div>
  );
}
