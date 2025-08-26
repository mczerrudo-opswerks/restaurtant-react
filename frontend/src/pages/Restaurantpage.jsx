import React, { useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function RestaurantsPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await api("/restaurants/", { token });
        if (alive) setRestaurants(res.results || res);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [token]);

  const filtered = restaurants.filter(r =>
    r.name.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-semibold">Restaurants</h2>
        <div className="ml-auto w-64">
          <input
            className="w-full border rounded px-3 py-2"
            placeholder="Search…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>
      {loading ? (
        <div>Loading…</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((r) => (
            <div key={r.id} className="border rounded-xl p-4 shadow-sm">
              <div className="text-lg font-medium">{r.name}</div>
              <div className="text-sm text-gray-500">{r.address}</div>
              <button
                onClick={() => navigate(`/menu?restaurant=${r.id}`)}
                className="mt-2 w-full bg-black text-white py-2 rounded"
              >
                View menu
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
