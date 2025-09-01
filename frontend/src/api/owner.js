// src/api/owner.js
import { api } from "./client";


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


// -------------------- RESTAURANTS (owner scope) --------------------

// List only the restaurants owned by the current user
export async function getMyRestaurants(user, token) {
  const res = await api(`/restaurants/?owner_name=${user?.username}`, { token });
  return res.results || res || [];
}

// Get details of a single restaurant
export async function getRestaurant(id, token) {
  return api(`/restaurants/${id}/`, { token });
}

// Create a new restaurant
// payload: { name, address, ... }
export async function createRestaurant(payload, token) {
  return api("/restaurants/", { method: "POST", body: payload, token });
}

// Update an existing restaurant
export async function updateRestaurant(id, payload, token) {
  return api(`/restaurants/${id}/`, { method: "PATCH", body: payload, token });
}

// Delete a restaurant
export async function deleteRestaurant(id, token) {
  return api(`/restaurants/${id}/`, { method: "DELETE", token });
}
