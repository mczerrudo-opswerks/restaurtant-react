import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import {
  Navigate,
  Outlet,
} from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { TopBar, CheckoutBar } from "../Routes";

export default function ProtectedLayout() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { items, singleRestaurant } = useCart();

  if (!token) return <Navigate to="/login" replace />;

  const handleCheckout = async () => {
    if (!singleRestaurant || items.length === 0) {
      throw "Cart must contain items from a single restaurant.";
    }
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