// src/components/Modal.jsx
import React, { useEffect } from "react";
import { createPortal } from "react-dom";

export default function Modal({ open, title, onClose, children, disableClose }) {
  // Close on ESC
  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === "Escape" && !disableClose) onClose?.();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, disableClose, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={() => !disableClose && onClose?.()}
      />

      {/* Panel */}
      <div className="relative w-full max-w-xl mx-4 rounded-2xl bg-white shadow-xl ring-1">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            type="button"
            className="p-2 rounded-xl hover:bg-zinc-100"
            onClick={() => !disableClose && onClose?.()}
            aria-label="Close"
            disabled={!!disableClose}
          >
            ✕
          </button>
        </div>

        <div className="p-5">{children}</div>
      </div>
    </div>,
    document.body
  );
}
