import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CartProvider, useCart } from "./context/CartContext";
import { api } from "./api/client";

import { ToastContainer, Bounce } from "react-toastify";

// Pages
import {
  LoginPage,
  RestaurantsPage,
  MenuPage,
  CheckoutBar,
  OrdersPage,
  TopBar,
  OwnerDashboard,
  OwnerLayout,
  OwnerRestaurant,
  CartPage,
  RegisterPage
} from "./Routes.js";
import { useNavigate } from "react-router-dom";
// (Add these when ready)
// import RestaurantsPage from "./pages/RestaurantsPage";
// import MenuPage from "./pages/MenuPage";
// import OrdersPage from "./pages/OrdersPage";

// (Optional shared UI)
// import TopBar from "./components/TopBar";
// import CheckoutBar from "./components/CheckoutBar";

function Protected() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { items, restaurant, singleRestaurant } = useCart();

  if (!token) return <Navigate to="/login" replace />;

  const handleCheckout = async () => {
    if (!singleRestaurant || items.length === 0) {
      throw "Cart must contain items from a single restaurant.";
    }
    // const payload = {
    //   restaurant,
    //   items: items.map((i) => ({ menu_item: i.id, quantity: i.qty })),
    // };
    // // POST /orders/
    // const res = await api("/orders/", { method: "POST", body: payload, token });
    // // Optionally: return res for a toast/snackbar in CheckoutBar
    // return res;
    navigate("/cart", { replace: true });

  };

  return (
    <div className="min-h-screen pb-20">
      <TopBar />
      <Outlet />
      <CheckoutBar onCheckout={handleCheckout} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected area */}
            <Route element={<Protected />}>
              <Route path="/" element={<RestaurantsPage />} />
              <Route path="/menu" element={<MenuPage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/cart" element={<CartPage />} />

              {/* Owner area */}
              <Route element={<OwnerLayout />}>
                <Route path="/owner" element={<OwnerDashboard />} />
                {/* Next step: */}
                <Route
                  path="/owner/restaurants/:id"
                  element={<OwnerRestaurant />}
                />
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

          <ToastContainer
            position="top-center"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick={false}
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="colored"
            transition={Bounce}
          />
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}
