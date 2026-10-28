import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthContext } from "./AuthContext";

const BASE = "http://localhost:5000";
const STORAGE_KEY = "admin_panel_auth";

const readStoredUser = () => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed?.token ? parsed : null;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(readStoredUser);

  const logout = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }, []);

  // Expected backend contract: POST /api/auth/login { email, password }
  // -> { success, token, user: { id, name, email, role } }
  const login = useCallback(async (email, password) => {
    try {
      const response = await fetch(`${BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();

      if (!response.ok || !data.success || !data.token) {
        return { success: false, message: data.message || "Invalid email or password." };
      }

      const profile = data.user || data;
      if (profile.role !== "admin") {
        return { success: false, message: "This account does not have admin access." };
      }

      const nextUser = {
        token: data.token,
        id: profile.id || profile._id,
        name: profile.name,
        email: profile.email,
        role: profile.role,
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
      setUser(nextUser);
      return { success: true };
    } catch (err) {
      console.error("Admin login error:", err);
      return {
        success: false,
        message: "Unable to connect to the server. Please check your connection.",
      };
    }
  }, []);

  // An expired or invalid token (401) on any API call signs the admin out.
  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      const url = String(args[0]?.url || args[0]);
      if (response.status === 401 && !url.includes("/api/auth/login")) {
        logout();
      }
      return response;
    };
    return () => {
      window.fetch = originalFetch;
    };
  }, [logout]);

  const value = useMemo(() => ({ user, login, logout }), [user, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
