import React, { createContext, useContext, useState, useEffect } from "react";
import authService from "../services/auth";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem("token");
      if (storedToken) {
        try {
          // Decode token to get user info
          const payload = JSON.parse(atob(storedToken.split(".")[1]));

          // Check if token is expired
          if (payload.exp * 1000 < Date.now()) {
            localStorage.removeItem("token");
            setToken(null);
            setUser(null);
          } else {
            setToken(storedToken);
            // Set user from token payload
            setUser({
              id: payload.user_id,
              username: payload.sub, // This is the username from your backend
              email: payload.email || null,
            });
          }
        } catch (error) {
          console.error("Invalid token:", error);
          localStorage.removeItem("token");
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (username, password) => {
    const data = await authService.login(username, password);
    setToken(data.access_token);
    setUser(data.user);
    localStorage.setItem("token", data.access_token);
    return data;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider
      value={{ user, token, login, logout, loading, isAuthenticated: !!token }}
    >
      {children}
    </AuthContext.Provider>
  );
};
