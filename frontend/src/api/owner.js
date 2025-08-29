// src/api/owner.js
import { api } from "./client";

// Restaurants owned by current user
export async function getMyRestaurants(token) {
  const res = await api("/restaurants/?owner=me", { token });
  return res.results || res || [];
}

// Menu items for a given restaurant
export async function listMenuItems(restaurantId, token) {
  const res = await api(`/menu_item/?restaurant=${restaurantId}`, { token });
  return res.results || res || [];
}

export async function createMenuItem(payload, token) {
  // payload should include { restaurant, name, price, ... }
  return api("/menu_item/", { method: "POST", body: payload, token });
}

export async function updateMenuItem(id, payload, token) {
  return api(`/menu_item/${id}/`, { method: "PATCH", body: payload, token });
}

export async function deleteMenuItem(id, token) {
  return api(`/menu_item/${id}/`, { method: "DELETE", token });
}
