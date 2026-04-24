/**
 * LoadingSpinner.jsx
 * Reusable spinner + full-screen overlay variant
 */

import React from "react";
import clsx from "clsx";

export default function LoadingSpinner({
  size = "md",
  fullScreen = false,
  label = null,
  className = "",
}) {
  const sizes = {
    sm: "w-4 h-4 border-2",
    md: "w-7 h-7 border-2",
    lg: "w-12 h-12 border-[3px]",
    xl: "w-16 h-16 border-4",
  };

  const spinner = (
    <div
      className={clsx(
        "rounded-full border-white/10 border-t-indigo-500 animate-spin",
        sizes[size],
        className
      )}
      role="status"
      aria-label={label ?? "Loading"}
    />
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-[#0a0c0f]/80 backdrop-blur-sm flex flex-col items-center justify-center z-50 gap-4">
        {spinner}
        {label && (
          <p className="text-white/40 text-sm animate-pulse">{label}</p>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-2">
      {spinner}
      {label && <span className="text-white/40 text-sm">{label}</span>}
    </div>
  );
}
