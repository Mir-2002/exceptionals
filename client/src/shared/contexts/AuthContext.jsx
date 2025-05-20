import React, { createContext, useState, useEffect, useContext } from 'react';
import { authAPI } from '../services/api';

// Create the auth context
export const AuthContext = createContext(null);

// Custom hook to use auth context
export const useAuth = () => useContext(AuthContext);

// AuthProvider component
export const AuthProvider = ({ children }) => {
  // Define state inside the component body
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Effect to check if user is already logged in
  useEffect(() => {
    const checkLoggedIn = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (token) {
          // Get current user data
          const response = await authAPI.getCurrentUser();
          setCurrentUser(response.data);
        }
      } catch (err) {
        console.error("Failed to fetch user:", err);
        // Clear potentially invalid token
        localStorage.removeItem('token');
        setError("Session expired. Please login again.");
      } finally {
        setLoading(false);
      }
    };

    checkLoggedIn();
  }, []);

  // Login function
  const login = async (credentials) => {
    try {
      setLoading(true);
      const response = await authAPI.login(credentials);
      
      // Save token to local storage
      localStorage.setItem('token', response.data.token);
      
      // Set user data
      setCurrentUser(response.data.user);
      
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Add GitHub login method
  const loginWithGitHub = async (code) => {
    try {
      setLoading(true);
      const response = await authAPI.githubLogin(code);
      
      // Store both tokens - regular API and GitHub
      localStorage.setItem('token', response.data.token);
      if (response.data.githubToken) {
        localStorage.setItem('githubToken', response.data.githubToken);
      }
      
      setCurrentUser(response.data.user);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || "GitHub login failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    setCurrentUser(null);
  };

  // The auth context value
  const value = {
    currentUser,
    loading,
    error,
    login,
    loginWithGitHub,
    logout
  };

  // Return the provider with the context value
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};