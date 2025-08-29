import React, { useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useSearchParams } from "react-router-dom";
import { useCart } from "../context/CartContext";

export default function MenuPage() {
  const { token } = useAuth();
  const [searchParams] = useSearchParams();
  const restaurantId = searchParams.get("restaurant");

  const { add } = useCart(); //For Carts

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await api(`/menu_item/?restaurant=${restaurantId}`, { token });
        if (alive) setItems(res.results || res);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [restaurantId, token]);

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-4">
      <h2 className="text-xl font-semibold">Menu</h2>
      {loading ? (
        <div>Loading…</div>
      ) : items.length === 0 ? (
        <div className="border rounded-xl p-4">No menu items found.</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((m) => (
            <div key={m.id} className="border rounded-xl p-4 shadow-sm">
              <div className="font-medium">{m.name}</div>
              <div className="text-sm">₱{Number(m.price).toFixed(2)}</div>
              <button
                onClick={() => add(m)}
                className="mt-2 w-full bg-black text-white py-2 rounded"
              >
                Add to cart
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
