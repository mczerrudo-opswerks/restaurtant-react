import React, { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import CheckoutBar from "../components/CheckoutBar"; // keep cart visible if you want

export default function OwnerLayout() {
  const { token, getUserIdFromToken, user } = useAuth();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [allowed, setAllowed] = useState(true);

  useEffect(() => {
     setAllowed(user?.is_restaurant_owner);   
  }, [token, user?.is_restaurant_owner]);

  if (!token)
    return <Navigate to="/login" replace state={{ from: location }} />;
  if (loading) return <div className="p-6">Loading…</div>;
  console.log(allowed);
  if (!allowed) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-5xl mx-auto px-4 py-4">
        <div className="mb-4 flex items-center gap-3 text-sm">
          <span className="font-medium">Owner</span>
          <span className="text-gray-500">
            / Manage your restaurants & menu
          </span>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
