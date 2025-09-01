import React, { useEffect, useState, useCallback } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "cancelled", label: "Cancelled" },
];

export default function OrdersPage() {
  const { token } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // filter state
  const [restaurants, setRestaurants] = useState([]);
  const [filters, setFilters] = useState({
    restaurant: "",
    status: "",
    ordering: "-created_at", // newest first (matches your DRF UI)
  });

  // build query string from filters
  const buildQuery = () => {
    const params = new URLSearchParams();
    if (filters.restaurant) params.set("restaurant", filters.restaurant);
    if (filters.status) params.set("status", filters.status);
    if (filters.ordering) params.set("ordering", filters.ordering);
    return `?${params.toString()}`;
  };

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api(`/orders/${buildQuery()}`, { token });
      setOrders(res?.results || res || []);
    } catch (e) {
      setError(e?.data?.detail || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [token, filters]);

  // initial data
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        // orders (with current filters)
        const [ordersRes, restRes] = await Promise.all([
          api(`/orders/${buildQuery()}`, { token }),
          api("/restaurants/", { token }), // for dropdown
        ]);
        if (alive) {
          setOrders(ordersRes || []);
          setRestaurants(restRes || []);
        }
      } catch (e) {
        if (alive) setError(e?.data?.detail || "Failed to load orders");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [token]);

  // refetch whenever filters change
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const clearFilters = () =>
    setFilters({ restaurant: "", status: "", ordering: "-created_at" });

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-semibold">My Orders</h2>
        <button
          onClick={fetchOrders}
          className="ml-auto px-3 py-2 rounded border shadow-sm hover:bg-gray-50 active:scale-[0.99]"
        >
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="border rounded-xl p-4 grid gap-3 md:grid-cols-3">
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-700">Restaurant</label>
          <select
            className="border rounded px-2 py-2"
            value={filters.restaurant}
            onChange={(e) =>
              setFilters((f) => ({ ...f, restaurant: e.target.value }))
            }
          >
            <option value="">All restaurants</option>
            {restaurants.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-700">Status</label>
          <select
            className="border rounded px-2 py-2"
            value={filters.status}
            onChange={(e) =>
              setFilters((f) => ({ ...f, status: e.target.value }))
            }
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-700">Created at</label>
          <select
            className="border rounded px-2 py-2"
            value={filters.ordering}
            onChange={(e) =>
              setFilters((f) => ({ ...f, ordering: e.target.value }))
            }
          >
            <option value="created_at">Oldest first</option>
            <option value="-created_at">Newest first</option>
          </select>
        </div>

        <div className="md:col-span-3 flex gap-2">
          <button
            onClick={fetchOrders}
            className="px-3 py-2 rounded border shadow-sm hover:bg-gray-50"
          >
            Apply
          </button>
          <button
            onClick={clearFilters}
            className="px-3 py-2 rounded border hover:bg-gray-50"
            type="button"
          >
            Clear
          </button>
        </div>
      </div>

      {loading ? (
        <div>Loading…</div>
      ) : error ? (
        <div className="text-red-600 text-sm">{error}</div>
      ) : orders.length === 0 ? (
        <div className="border rounded-xl p-4">No orders found.</div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => {
            const restaurantName = o?.items?.[0]?.menu_item?.restaurant_name;
            const total =
              o?.items?.reduce(
                (sum, it) => sum + Number(it.item_subtotal || 0),
                0
              ) || 0;

            return (
              <div key={o.order_id} className="border rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="font-medium break-all">Order #{o.order_id}</div>
                  <div className="text-sm text-gray-600">
                    {formatDate(o.created_at)}
                  </div>
                </div>

                <div className="text-sm text-gray-700 mt-1">
                  Status: <span className="font-medium">{o.status || "—"}</span>
                </div>

                <div className="text-sm text-gray-700">
                  Restaurant: {restaurantName}
                </div>

                <div className="mt-2 text-sm">
                  <span className="font-medium">Total:</span> ₱{total.toFixed(2)}
                </div>

                {Array.isArray(o.items) && o.items.length > 0 && (
                  <div className="mt-3 text-sm">
                    <div className="font-medium mb-1">Items</div>
                    <ul className="list-disc pl-5 space-y-1">
                      {o.items.map((it) => (
                        <li key={it.id}>
                          {it.menu_item?.name} × {it.quantity}
                          {it.item_subtotal
                            ? ` — ₱${Number(it.item_subtotal).toFixed(2)}`
                            : ""}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function formatDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
}
