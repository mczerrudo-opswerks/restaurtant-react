import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getMyRestaurants,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
} from "../api/owner";
import RestaurantForm from "../components/RestaurantForm";
import Modal from "../components/Modal";

export default function OwnerDashboard() {
  const { token, user } = useAuth();
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [mode, setMode] = useState(null); // 'create' | 'edit'
  const [active, setActive] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await getMyRestaurants(user, token);
      setRestaurants(data);
    } catch (e) {
      setError(e?.data?.detail || "Failed to load your restaurants");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [token]);

  const startCreate = () => {
    setMode("create");
    setActive(null);
    setMsg("");
  };
  const startEdit = (r) => {
    setMode("edit");
    setActive(r);
    setMsg("");
  };
  const cancelForm = () => {
    setMode(null);
    setActive(null);
  };

  const onCreate = async (values) => {
    setSubmitting(true);
    try {
      const created = await createRestaurant(values, token);
      setRestaurants((prev) => [created, ...prev]);
      setMode(null);
      setMsg("Restaurant created");
    } catch (e) {
      setMsg(normalizeErr(e));
    } finally {
      setSubmitting(false);
    }
  };

  const onUpdate = async (values) => {
    if (!active) return;
    setSubmitting(true);
    try {
      const updated = await updateRestaurant(
        active.id || active.restaurant_id,
        values,
        token
      );
      const id = active.id || active.restaurant_id;
      setRestaurants((prev) =>
        prev.map((x) => ((x.id || x.restaurant_id) === id ? updated : x))
      );
      setMode(null);
      setActive(null);
      setMsg("Restaurant updated");
    } catch (e) {
      setMsg(normalizeErr(e));
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async (r) => {
    const id = r.id || r.restaurant_id;
    if (!confirm(`Delete restaurant "${r.name}"? This cannot be undone.`))
      return;
    try {
      await deleteRestaurant(id, token);
      setRestaurants((prev) =>
        prev.filter((x) => (x.id || x.restaurant_id) !== id)
      );
      setMsg("Restaurant deleted");
    } catch (e) {
      setMsg(normalizeErr(e));
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <h2 className="text-xl font-semibold">Your Restaurants</h2>
        <button
          onClick={startCreate}
          className="ml-auto px-3 py-2 border rounded bg-black text-white"
        >
          New Restaurant
        </button>
      </div>

      {msg && <div className="text-sm mb-2">{msg}</div>}

      {loading ? (
        <div>Loading…</div>
      ) : error ? (
        <div className="text-red-600 text-sm">{error}</div>
      ) : restaurants.length === 0 ? (
        <div className="border rounded-xl p-4">
          You don't own any restaurants yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border rounded-xl text-sm">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="p-2 border-b">Name</th>
                <th className="p-2 border-b">Address</th>
                <th className="p-2 border-b w-40">Actions</th>
              </tr>
            </thead>
            <tbody>
              {restaurants.map((r) => (
                <tr key={r.id || r.restaurant_id} className="border-b">
                  <td className="p-2 font-medium">{r.name}</td>
                  <td className="p-2 text-gray-600">{r.address}</td>
                  <td className="p-2">
                    <div className="flex gap-2">
                      <Link
                        to={`/owner/restaurants/${r.id || r.restaurant_id}`}
                        className="px-2 py-1 bg-black text-white rounded text-xs"
                      >
                        Manage Menu
                      </Link>
                      <button
                        className="px-2 py-1 border rounded text-xs"
                        onClick={() => startEdit(r)}
                      >
                        Edit
                      </button>
                      <button
                        className="px-2 py-1 border rounded text-xs"
                        onClick={() => onDelete(r)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={mode === "create"}
        title="Create menu item"
        onClose={cancelForm}
        disableClose={submitting} // prevent closing while submitting
      >
        <RestaurantForm
          initialValues={null}
          onSubmit={onCreate}
          onCancel={cancelForm}
          submitting={submitting}
        />
      </Modal>

      <Modal
        open={mode === "edit" && !!active}
        title="Edit menu item"
        onClose={cancelForm}
        disableClose={submitting}
      >
        <RestaurantForm
          initialValues={active}
          onSubmit={onUpdate}
          onCancel={cancelForm}
          submitting={submitting}
        />
      </Modal>
    </div>
  );
}

function normalizeErr(e) {
  if (!e) return "Something went wrong";
  if (typeof e === "string") return e;
  if (e?.data) {
    try {
      return JSON.stringify(e.data);
    } catch {}
  }
  return "Request failed";
}
