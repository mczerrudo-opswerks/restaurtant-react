import React, { useState } from "react";
import { useCart } from "../context/CartContext";

export default function CheckoutBar({ onCheckout }) {
  const { items, dec, clear, total, singleRestaurant} = useCart();
  const [msg, setMsg] = useState("");

  const handleCheckout = async () => {
    if (!onCheckout) return; // parent provides API call later
    try {
      setMsg("");
      await onCheckout();
    } catch (e) {
      console.log(e);
      setMsg(typeof e === "string" ? e : "Failed to checkout");
    }
  };

  return (
    <div className="fixed bottom-0 inset-x-0 border-t bg-white/90 backdrop-blur">
      <div className="max-w-5xl mx-auto p-3 flex flex-col sm:flex-row gap-3 items-center">
        <div className="flex-1 w-full">
          {items.length === 0 ? (
            <div className="text-sm text-gray-600">Cart is empty</div>
          ) : (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {items.map((i) => (
                <span key={i.id} className="px-2 py-1 border rounded-full">
                  {i.name} × {i.qty}
                  <button
                    onClick={() => dec(i.id)}
                    className="ml-2 text-gray-600"
                  >
                    −
                  </button>
                </span>
              ))}
            </div>
          )}
          {msg && <div className="text-sm mt-1">{msg}</div>}
          {!singleRestaurant && items.length > 0 && (
            <div className="text-xs text-red-600 mt-1">
              Cart contains items from different restaurants. Please keep to one
              restaurant per order.
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="font-medium">Total: ₱{total.toFixed(2)}</div>
          <button
            disabled={items.length === 0 || !singleRestaurant || !onCheckout}
            onClick={handleCheckout}
            className="px-4 py-2 rounded-2xl shadow-sm border bg-black text-white disabled:opacity-50"
          >
            {onCheckout ? "Place order" : "Checkout (wire API)"}
          </button>
        </div>
      </div>
    </div>
  );
}
