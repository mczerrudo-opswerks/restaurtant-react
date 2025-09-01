
import React, { useEffect, useState } from "react";


export default function MenuItemForm({ initialValues, onSubmit, onCancel, submitting }) {
  const [values, setValues] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    available: true,
  });

  useEffect(() => {
    if (initialValues) {
      setValues({
        name: initialValues.name ?? "",
        description: initialValues.description ?? "",
        price: initialValues.price ?? "",
        category: initialValues.category ?? "",
        available: initialValues.available ?? true,
      });
    }
  }, [initialValues]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setValues((v) => ({ ...v, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSubmit?.({
      ...values,
      price: values.price === "" ? "" : Number(values.price),
    });
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
        <label className="text-sm">Description</label>
        <textarea
          name="description"
          value={values.description}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-sm">Price</label>
          <input
            name="price"
            type="number"
            step="0.01"
            min="0"
            value={values.price}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="text-sm">Category</label>
          <input
            name="category"
            value={values.category}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            placeholder="e.g., Drinks, Mains"
          />
        </div>
      </div>

      <label className="inline-flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="available"
          checked={values.available}
          onChange={handleChange}
        />
        Available
      </label>

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
