import React, { createContext, useContext, useMemo, useState } from "react";

const CartCtx = createContext(null);
export function useCart() {
  return useContext(CartCtx);
}

export function CartProvider({ children }) {
  const [items, setItems] = useState([]); // [{ id, name, price, qty, restaurant }]

  const add = (item) => {
    // item: { id, name, price, restaurant }
    setItems((prev) => {
      const found = prev.find((p) => p.id === item.id);
      if (found)
        return prev.map((p) =>
          p.id === item.id ? { ...p, qty: p.qty + 1 } : p
        );
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const dec = (id) => {
    setItems((prev) =>
      prev
        .map((p) => (p.id === id ? { ...p, qty: p.qty - 1 } : p))
        .filter((p) => p.qty > 0)
    );
  };

  const updateQty = (id, quantity) => {
    if (quantity < 1) return;
    setItems((items) =>
      items.map((x) => (x.id === id ? { ...x, qty: quantity } : x))
    );
  };

  const remove = (id) => setItems((prev) => prev.filter((p) => p.id !== id));
  const clear = () => setItems([]);

  const count = items.reduce((s, x) => s + x.qty, 0);
  const total = items.reduce((s, x) => s + Number(x.price) * x.qty, 0);

  const restaurant = items[0]?.restaurant ?? null; // used later for order payloads
  const singleRestaurant = items.every((i) => i.restaurant === restaurant);

  const value = useMemo(
    () => ({
      items,
      add,
      dec,
      remove,
      clear,
      count,
      total,
      restaurant,
      singleRestaurant,
      updateQty,
    }),
    [items, count, total, restaurant, singleRestaurant]
  );

  return (
    <CartCtx.Provider value={value}>
      {children}
    </CartCtx.Provider>
  );
}
