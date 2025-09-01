import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
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
  RegisterPage,
  ProtectedLayout,
} from "./Routes.js";

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
            <Route element={<ProtectedLayout />}>
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
