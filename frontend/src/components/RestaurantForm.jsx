// src/pages/components/RestaurantForm.jsx
import React, { useEffect, useState } from "react";

/**
 * Reusable form for creating/updating a Restaurant.
 * Props:
 *  - initialValues: { name, address }
 *  - onSubmit: async (values) => void
 *  - onCancel: () => void
 *  - submitting: boolean
 */
export default function RestaurantForm({ initialValues, onSubmit, onCancel, submitting }) {
  const [values, setValues] = useState({ name: "", address: "" });

  useEffect(() => {
    if (initialValues) {
      setValues({
        name: initialValues.name ?? "",
        address: initialValues.address ?? "",
      });
    }
  }, [initialValues]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSubmit?.(values);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="text-sm">Name</label>
        <input
          name="name"
          value={values.name}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2"
          required
        />
      </div>

      <div>
        <label className="text-sm">Address</label>
        <input
          name="address"
          value={values.address}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2"
        />
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button
          disabled={submitting}
          className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
        >
          {submitting ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded border"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
