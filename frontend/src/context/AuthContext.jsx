import React, { createContext, useContext, useState } from "react";
import { api } from "../api/client";

const AuthCtx = createContext(null);
export function useAuth() {
  return useContext(AuthCtx);
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState(() => {
    const u = localStorage.getItem("user");
    return u ? JSON.parse(u) : null;
  });

  const login = async (username, password) => {
    const data = await api("/api/token/", {
      method: "POST",
      body: { username, password },
    });
    setToken(data.access);
    localStorage.setItem("token", data.access);

    const u = { username };
    setUser(u);
    localStorage.setItem("user", JSON.stringify(u));
  };

  const logout = () => {
    setToken("");
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  return (
    <AuthCtx.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}
