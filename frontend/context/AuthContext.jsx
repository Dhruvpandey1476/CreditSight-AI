"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Load user from token on initial render
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const res = await fetch("/api/auth/me", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (res.ok) {
            const userData = await res.json();
            setUser(userData);
          } else {
            localStorage.removeItem("token");
          }
        } catch (error) {
          console.error("Failed to load user:", error);
          localStorage.removeItem("token");
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  const login = async (username, password) => {
    const formData = new URLSearchParams();
    formData.append("username", username);
    formData.append("password", password);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData,
    });

    if (!res.ok) {
      let errorData;
      const text = await res.text();
      try {
        errorData = JSON.parse(text);
      } catch (e) {
        errorData = { detail: text || `Server error (${res.status})` };
      }
      throw new Error(errorData.detail || "Login failed");
    }

    const data = await res.json();
    localStorage.setItem("token", data.access_token);
    
    // Fetch user details
    const userRes = await fetch("/api/auth/me", {
      headers: {
        Authorization: `Bearer ${data.access_token}`,
      },
    });
    
    if (userRes.ok) {
      const userData = await userRes.json();
      setUser(userData);
      // Let the calling component handle routing so it can show success states
    }
  };

  const register = async (username, email, password) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, email, password }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ detail: "An unexpected server error occurred." }));
      throw new Error(errorData.detail || "Registration failed");
    }

    // Auto login after registration
    await login(username, password);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
