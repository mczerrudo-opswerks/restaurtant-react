// src/pages/owner/OwnerRestaurant.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import {
  listMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} from "../api/owner";
import MenuItemForm from "../components/MenuItemForm";
import Modal from "../components/Modal";

export default function OwnerRestaurant() {
  const { id } = useParams(); // restaurant id (uuid/int)
  const { token } = useAuth();

  const [restaurant, setRestaurant] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [q, setQ] = useState("");
  const [mode, setMode] = useState(null); // 'create' | 'edit'
  const [active, setActive] = useState(null); // item being edited
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");

  const filtered = items;

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const r = await api(`/restaurants/${id}/`, { token });
        const m = await listMenuItems(id, token, q);
        if (!alive) return;
        setRestaurant(r);
        setItems(m);
      } catch (e) {
        if (!alive) return;
        setError(e?.data?.detail || "Failed to load restaurant/menu");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id, token]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const m = await listMenuItems(id, token, q);
        setItems(m);
      } catch (e) {
        setError(e?.data?.detail || "Failed to load menu items");
      } 
    };
    fetchData();
  }, [q]);

  const startCreate = () => {
    setMode("create");
    setActive(null);
    setMsg("");
  };
  const startEdit = (item) => {
    setMode("edit");
    setActive(item);
    setMsg("");
  };
  const cancelForm = () => {
    setMode(null);
    setActive(null);
  };

  const onCreate = async (values) => {
    setSubmitting(true);
    try {
      const payload = { ...values, restaurant: id };
      const created = await createMenuItem(payload, token);
      setItems((prev) => [created, ...prev]);
      setMode(null);
      setMsg("Menu item created");
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
      const updated = await updateMenuItem(active.id, values, token);
      setItems((prev) => prev.map((x) => (x.id === active.id ? updated : x)));
      setMode(null);
      setActive(null);
      setMsg("Menu item updated");
    } catch (e) {
      setMsg(normalizeErr(e));
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async (item) => {
    if (!confirm(`Delete "${item.name}"?`)) return;
    try {
      await deleteMenuItem(item.id, token);
      setItems((prev) => prev.filter((x) => x.id !== item.id));
      setMsg("Menu item deleted");
    } catch (e) {
      setMsg(normalizeErr(e));
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <h2 className="text-xl font-semibold">Manage Menu</h2>
        <Link to="/owner" className="ml-auto text-sm underline">
          ← Back to restaurants
        </Link>
      </div>

      {loading ? (
        <div>Loading…</div>
      ) : error ? (
        <div className="text-red-600 text-sm">{error}</div>
      ) : (
        <>
          <div className="mb-4">
            <div className="text-lg font-medium">{restaurant?.name}</div>
            <div className="text-sm text-gray-600">{restaurant?.address}</div>
          </div>

          {/* Search + actions */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
            <div className="flex-1">
              <input
                className="w-full border rounded px-3 py-2"
                placeholder="Search by name"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <button
              onClick={startCreate}
              className="px-3 py-2 rounded bg-black text-white"
            >
              New Item
            </button>
          </div>

          {msg && <div className="text-sm mb-2">{msg}</div>}

          {/* Table */}
          <div className="overflow-x-auto border rounded-xl">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3">Name</th>
                  <th className="text-left p-3">Category</th>
                  <th className="text-left p-3">Price</th>
                  <th className="text-left p-3">Available</th>
                  <th className="text-right p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((it) => (
                  <tr key={it.id} className="border-t">
                    <td className="p-3">{it.name}</td>
                    <td className="p-3">{it.category || "—"}</td>
                    <td className="p-3">₱{Number(it.price).toFixed(2)}</td>
                    <td className="p-3">{it.is_available ? "Yes" : "No"}</td>
                    <td className="p-3 text-right space-x-2">
                      <button
                        className="px-3 py-1 border rounded"
                        onClick={() => startEdit(it)}
                      >
                        Edit
                      </button>
                      <button
                        className="px-3 py-1 border rounded"
                        onClick={() => onDelete(it)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-gray-500">
                      No items found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Modal
            open={mode === "create"}
            title="Create menu item"
            onClose={cancelForm}
            disableClose={submitting} // prevent closing while submitting
          >
            <MenuItemForm
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
            <MenuItemForm
              initialValues={active}
              onSubmit={onUpdate}
              onCancel={cancelForm}
              submitting={submitting}
            />
          </Modal>
        </>
      )}
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
