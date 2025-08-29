// src/pages/owner/OwnerDashboard.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";

/**
 * Lists the restaurants owned by the current user.
 * Backend options:
 *  - GET /restaurants/?owner=me
 *  - or GET /my/restaurants/
 */
export default function OwnerDashboard() {
  const { token,user } = useAuth();
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await api(`/restaurants/?owner_name=${user.username}`, { token });
        if (!alive) return;
        setRestaurants(res.results || res || []);
      } catch (e) {
        if (!alive) return;
        setError(e?.data?.detail || "Failed to load your restaurants");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [token]);

  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <h2 className="text-xl font-semibold">Your Restaurants</h2>
        {/* Optional: add a Create Restaurant button if backend supports */}
        {/* <button className="ml-auto px-3 py-2 border rounded">New Restaurant</button> */}
      </div>

      {loading ? (
        <div>Loading…</div>
      ) : error ? (
        <div className="text-red-600 text-sm">{error}</div>
      ) : restaurants.length === 0 ? (
        <div className="border rounded-xl p-4">You don't own any restaurants yet.</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {restaurants.map((r) => (
            <div key={r.id || r.restaurant_id} className="border rounded-xl p-4 shadow-sm">
              <div className="text-lg font-medium">{r.name}</div>
              <div className="text-sm text-gray-600">{r.address}</div>
              <Link
                to={`/owner/restaurants/${r.id || r.restaurant_id}`}
                className="mt-3 inline-block w-full text-center bg-black text-white py-2 rounded"
              >
                Manage Menu
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
