import React, { useRef, useEffect } from "react";
import { Search, ScanLine, X, Loader2 } from "lucide-react";
import { useKeyboardShortcuts } from "../hooks";
import { isBarcode } from "../utils";

export default function ProductSearchBar({
  value, onChange, onSearch, isLoading = false,
  placeholder = "Search products, SKU or scan barcode…  (F2)",
  autoFocus = false,
}) {
  const inputRef = useRef(null);
  const barcodeMode = isBarcode(value);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  useKeyboardShortcuts({
    F2: () => inputRef.current?.focus(),
    Escape: () => {
      if (document.activeElement === inputRef.current) inputRef.current?.blur();
    },
  });

  return (
    <div style={{ position: "relative", fontFamily: "'DM Sans', sans-serif" }}>
      {/* Left icon */}
      <div style={{
        position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
        pointerEvents: "none", display: "flex", alignItems: "center",
        color: barcodeMode ? "#f59e0b" : isLoading ? "#6366f1" : "rgba(255,255,255,0.3)",
        transition: "color 0.15s",
      }}>
        {barcodeMode ? <ScanLine size={17} /> : isLoading ? <Loader2 size={17} className="animate-spin" /> : <Search size={17} />}
      </div>

      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => e.key === "Enter" && onSearch?.(value, isBarcode(value))}
        placeholder={placeholder}
        style={{
          width: "100%", height: 44,
          background: barcodeMode ? "rgba(245,158,11,0.07)" : "rgba(255,255,255,0.04)",
          border: `1px solid ${barcodeMode ? "rgba(245,158,11,0.35)" : "rgba(255,255,255,0.09)"}`,
          borderRadius: 12, padding: "0 40px 0 44px",
          color: "rgba(255,255,255,0.85)", fontSize: 13,
          fontFamily: "'DM Sans', sans-serif",
          outline: "none", transition: "all 0.18s",
          boxShadow: barcodeMode ? "0 0 0 3px rgba(245,158,11,0.12)" : "none",
        }}
        onFocus={e => {
          if (!barcodeMode) {
            e.target.style.borderColor = "rgba(99,102,241,0.5)";
            e.target.style.background = "rgba(255,255,255,0.06)";
            e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.12)";
          }
        }}
        onBlur={e => {
          if (!barcodeMode) {
            e.target.style.borderColor = "rgba(255,255,255,0.09)";
            e.target.style.background = "rgba(255,255,255,0.04)";
            e.target.style.boxShadow = "none";
          }
        }}
      />

      {/* Barcode badge */}
      {barcodeMode && (
        <div style={{
          position: "absolute", right: 36, top: "50%", transform: "translateY(-50%)",
          fontSize: 9, padding: "2px 6px", borderRadius: 4, fontWeight: 700,
          background: "rgba(245,158,11,0.2)", color: "#fbbf24",
          border: "1px solid rgba(245,158,11,0.3)", letterSpacing: "0.06em",
        }}>
          BARCODE
        </div>
      )}

      {/* Clear */}
      {value && !barcodeMode && (
        <button
          onClick={() => { onChange(""); inputRef.current?.focus(); }}
          tabIndex={-1}
          style={{
            position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
            background: "none", border: "none", cursor: "pointer",
            color: "rgba(255,255,255,0.25)", padding: 2, display: "flex",
            alignItems: "center", justifyContent: "center",
          }}
        >
          <X size={15} />
        </button>
      )}
    </div>
  );
}