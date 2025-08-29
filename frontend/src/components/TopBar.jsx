// src/components/TopBar.jsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

export default function TopBar() {
  const { user, logout } = useAuth();
  const { count, total } = useCart();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Left links */}
        <div className="flex items-center gap-3">
          <Link to="/" className="font-semibold hover:underline">
            🍽️ Restaurants
          </Link>
          <Link to="/orders" className="hover:underline">
            My Orders
          </Link>
          {user?.is_restaurant_owner && (
            <Link to="/owner" className="hover:underline">
              Owner
            </Link>
          )}
        </div>

        {/* Right section */}
        <div className="flex items-center gap-4 text-sm">
          {user && <span className="text-gray-700">👤 {user.username}</span>}
          <span className="text-gray-700">
            🛒 {count} • ₱{total.toFixed(2)}
          </span>
          <button
            onClick={handleLogout}
            className="px-3 py-1 border rounded bg-white hover:bg-gray-100"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
