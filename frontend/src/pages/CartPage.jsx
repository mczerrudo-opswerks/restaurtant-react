// src/pages/CartPage.jsx
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext"; // assumes you already have this
import { createOrder } from "../api/customer";
import { toast } from "react-toastify";


export default function CartPage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { items, updateQty, clear, total, restaurant, remove } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");


  const onSubmit = async () => {
    if (!items.length) return;
    setSubmitting(true);
    setError("");
    try {
      // translate cart items to API payload
      const payload = {
        restaurant,
        items: items.map((i) => ({ menu_item: i.id, quantity: i.qty })),
      };
      const res = await createOrder(payload, token);
      toast.success(`Order placed successfully! Order ID: ${res.order_id}`);

      clear();
      navigate("/orders", { state: { placed: true, order: res } });
    } catch (e) {
      setError(e?.data?.detail || "Failed to place order");
    } finally {
      setSubmitting(false);
    }
  };

  const onChangeQty = (id, next) => {
    if (next < 1) return; // guard
    updateQty(id, next);
  };

  if (!items.length) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <h1 className="text-2xl font-semibold mb-4">Your Cart</h1>
        <div className="p-6 border rounded-xl">Your cart is empty.</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-semibold">Your Cart</h1>

      {error && (
        <div className="p-3 rounded-lg bg-red-100 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="border rounded-xl divide-y">
        {items.map((it) => (
          <div key={it.id} className="p-4 flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{it.name}</div>
              <div className="text-sm text-gray-500">
                ₱{Number(it.price).toFixed(2)}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                className="px-2 py-1 rounded-lg border"
                onClick={() => onChangeQty(it.id, it.qty - 1)}
                aria-label={`Decrease ${it.name}`}
              >
                -
              </button>
              <input
                type="number"
                className="w-16 text-center border rounded-lg py-1"
                min={1}
                value={it.qty}
                onChange={(e) => onChangeQty(it.id, Number(e.target.value))}
              />
              <button
                className="px-2 py-1 rounded-lg border"
                onClick={() => onChangeQty(it.id, it.qty + 1)}
                aria-label={`Increase ${it.name}`}
              >
                +
              </button>
            </div>

            <div className="w-24 text-right font-medium">
              ₱{(Number(it.price) * it.qty).toFixed(2)}
            </div>

            <button
              className="ml-2 text-red-600 hover:underline"
              onClick={() => remove(it.id)}
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-end gap-6">
        <div className="text-lg">
          <span className="text-gray-500 mr-2">Total:</span>
          <span className="font-semibold">₱{total.toFixed(2)}</span>
        </div>
        <button
          onClick={onSubmit}
          disabled={submitting}
          className="px-4 py-2 rounded-xl bg-black text-white disabled:opacity-60"
        >
          {submitting ? "Placing..." : "Place Order"}
        </button>
      </div>
    </div>
  );
}
