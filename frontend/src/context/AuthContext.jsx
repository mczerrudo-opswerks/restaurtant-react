import React, { createContext, useContext, useState } from "react";
import { api } from "../api/client";
import {jwtDecode} from "jwt-decode";

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

  const getUserIdFromToken = (token) => {
    try {
      const decoded = jwtDecode(token);
      return decoded.user_id ?? decoded.userId ?? decoded.sub ?? null;
    } catch {
      return null;
    }
  };

  const login = async (username, password) => {
    const data = await api("/api/token/", {
      method: "POST",
      body: { username, password },
    });
    setToken(data.access);
    localStorage.setItem("token", data.access);

    const u = await api(`/user/${getUserIdFromToken(data.access)}`, { token: data.access });
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
    <AuthCtx.Provider value={{ token, user, login, logout, getUserIdFromToken}}>
      {children}
    </AuthCtx.Provider>
  );
}
