const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function api(path, { method = "GET", body, token } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

   if (!res.ok) {
    if (res.status === 401) {
      // clear auth state
      localStorage.removeItem("token");
      localStorage.removeItem("user");

    }
    throw { status: res.status, data };
  }

  return data;
}
