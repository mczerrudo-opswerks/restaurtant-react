import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { register } from "../api/customer";
import { toast } from "react-toastify";

/**
 * Body: {
 *   username, email, first_name, last_name, password, password2
 * }
 **/

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login, token } = useAuth();

  const [values, setValues] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    password: "",
    password2: "",
    is_restaurant_owner: false,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({}); // field-level errors from DRF
  const [nonFieldError, setNonFieldError] = useState("");

  const onChange = (e) => {
    const { name, type, value, checked } = e.target;
    setValues((v) => ({
      ...v,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const validateLocal = () => {
    const e = {};
    if (!values.first_name) e.first_name = ["This field is required."];
    if (!values.last_name) e.last_name = ["This field is required."];
    if (!values.username) e.username = ["This field is required."];
    if (!values.email) e.email = ["This field is required."];
    if (!values.password) e.password = ["This field is required."];
    if (values.password !== values.password2)
      e.password2 = ["Passwords do not match."];

    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setErrors({});
    setNonFieldError("");

    const local = validateLocal();
    // Check if the local has entry it goes back and shows the error
    if (Object.keys(local).length) {
      setErrors(local);
      return;
    }

    setLoading(true);
    try {
      const res = await register(values, token);
      // Auto-login with the same credentials
      toast.success(
        `Registration successful! Hi ${values.username} Logging you in…`,
        {
          autoClose: 2000,
        }
      );
      await login(values.username, values.password);
      navigate("/", { replace: true });
    } catch (e) {
      // Expecting DRF-style errors { field: ["msg"], non_field_errors: ["msg"] }
      const data = e?.data || {};
      setErrors(data);
      setNonFieldError(
        Array.isArray(data?.non_field_errors)
          ? data.non_field_errors.join(" ")
          : data?.detail || "Registration failed"
      );
    } finally {
      setLoading(false);
    }
  };

  const FieldError = ({ name }) =>
    errors?.[name] ? (
      <div className="text-xs text-red-600 mt-1">
        {Array.isArray(errors[name])
          ? errors[name].join(" ")
          : String(errors[name])}
      </div>
    ) : null;

  return (
    <div className="min-h-screen grid place-items-center bg-gray-50 p-6">
      <div className="w-full max-w-md rounded-xl border p-6 bg-white shadow">
        <h1 className="text-2xl font-semibold mb-1">Create your account</h1>
        <p className="text-sm text-gray-500 mb-6">It's quick and easy.</p>

        {nonFieldError && (
          <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">
            {nonFieldError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm">First name</label>
              <input
                name="first_name"
                className="w-full border rounded px-3 py-2"
                value={values.first_name}
                onChange={onChange}
              />
              <FieldError name="first_name" />
            </div>
            <div>
              <label className="text-sm">Last name</label>
              <input
                name="last_name"
                className="w-full border rounded px-3 py-2"
                value={values.last_name}
                onChange={onChange}
              />
              <FieldError name="last_name" />
            </div>
          </div>

          <div>
            <label className="text-sm">Username</label>
            <input
              name="username"
              className="w-full border rounded px-3 py-2"
              value={values.username}
              onChange={onChange}
            />
            <FieldError name="username" />
          </div>

          <div>
            <label className="text-sm">Email</label>
            <input
              type="email"
              name="email"
              className="w-full border rounded px-3 py-2"
              value={values.email}
              onChange={onChange}
            />
            <FieldError name="email" />
          </div>

          <div>
            <label className="text-sm">Password</label>
            <input
              type="password"
              name="password"
              className="w-full border rounded px-3 py-2"
              value={values.password}
              onChange={onChange}
            />
            <FieldError name="password" />
          </div>

          <div>
            <label className="text-sm">Confirm Password</label>
            <input
              type="password"
              name="password2"
              className="w-full border rounded px-3 py-2"
              value={values.password2}
              onChange={onChange}
            />
            <FieldError name="password2" />
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="is_restaurant_owner"
              checked={values.is_restaurant_owner}
              onChange={onChange}
            />
            I am a restaurant owner
          </label>

          <button
            disabled={loading}
            className="w-full bg-black text-white py-2 rounded hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <div className="text-sm mt-4 text-center">
          Already have an account?{" "}
          <Link to="/login" className="underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
