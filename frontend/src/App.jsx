import React from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Pages
import {LoginPage, RestaurantsPage, MenuPage} from "./Routes.js";
// (Add these when ready)
// import RestaurantsPage from "./pages/RestaurantsPage";
// import MenuPage from "./pages/MenuPage";
// import OrdersPage from "./pages/OrdersPage";

// (Optional shared UI)
// import TopBar from "./components/TopBar";
// import CheckoutBar from "./components/CheckoutBar";

function Protected() {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return (
    <div className="min-h-screen pb-20">
      {/* <TopBar /> */}
      <Outlet />
      {/* <CheckoutBar /> */}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />
         

          {/* Protected area */}
          <Route element={<Protected />}>
             <Route path="/" element={<RestaurantsPage />} />
             <Route path="/menu" element={<MenuPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
