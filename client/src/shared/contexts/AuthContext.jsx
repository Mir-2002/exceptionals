import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';
import { jwtDecode }  from 'jwt-decode';

// Create auth context
const AuthContext = createContext(null);

// Custom hook for using auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Auth Provider component
export function AuthProvider(props) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tokenExpiryTime, setTokenExpiryTime] = useState(null);

  // Function to check if token is expired
  const isTokenExpired = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) return true;
    
    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      
      // Set expiry time in state (for UI countdown if needed)
      setTokenExpiryTime(decoded.exp);
      
      // Return true if token is expired
      return decoded.exp < currentTime;
    } catch (error) {
      console.error('Token decode error:', error);
      return true;
    }
  }, []);

  // Refresh authentication silently
  const refreshAuth = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token');
      }
      
      const response = await authAPI.refreshToken({ refreshToken });
      const { token, refreshToken: newRefreshToken } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', newRefreshToken);
      
      return true;
    } catch (error) {
      console.error('Auth refresh failed:', error);
      return false;
    }
  }, []);

  // Function to reload user data
  const reloadUser = useCallback(async () => {
    try {
      const response = await authAPI.getCurrentUser();
      setUser(response.data);
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      console.error('Failed to reload user:', error);
      return false;
    }
  }, []);

  // Setup periodic token refresh
  useEffect(() => {
    if (!isAuthenticated || !tokenExpiryTime) return;
    
    // Calculate time until token expires (with 5-minute buffer)
    const currentTime = Date.now() / 1000;
    const timeUntilExpiry = tokenExpiryTime - currentTime - 300; // 5-minute buffer
    const timeInMs = Math.max(timeUntilExpiry * 1000, 0);
    
    // Set up refresh timer
    const refreshTimer = setTimeout(async () => {
      const success = await refreshAuth();
      if (success) {
        await reloadUser();
      } else {
        logout();
      }
    }, timeInMs);
    
    return () => clearTimeout(refreshTimer);
  }, [isAuthenticated, tokenExpiryTime, refreshAuth, reloadUser]);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      // If token is expired, try to refresh
      if (isTokenExpired()) {
        const refreshed = await refreshAuth();
        if (!refreshed) {
          logout();
          setLoading(false);
          return;
        }
      }

      // Get current user data
      try {
        const response = await authAPI.getCurrentUser();
        setUser(response.data);
        setIsAuthenticated(true);
      } catch (error) {
        // If token is invalid, clear it
        logout();
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [isTokenExpired, refreshAuth]);

  // Login function
  function login(credentials) {
    return authAPI.login(credentials)
      .then(response => {
        const { user, token, refreshToken } = response.data;
        localStorage.setItem('token', token);
        if (refreshToken) {
          localStorage.setItem('refreshToken', refreshToken);
        }
        setUser(user);
        setIsAuthenticated(true);
        
        // Set token expiry time
        try {
          const decoded = jwtDecode(token);
          setTokenExpiryTime(decoded.exp);
        } catch (error) {
          console.error('Token decode error:', error);
        }
        
        return { success: true, user };
      })
      .catch(error => {
        return { 
          success: false, 
          error: error.response?.data?.message || 'Login failed' 
        };
      });
  }

  // GitHub login function
  function githubLogin(code) {
    return authAPI.githubLogin(code)
      .then(response => {
        const { user, token, refreshToken, githubToken } = response.data;
        localStorage.setItem('token', token);
        if (refreshToken) {
          localStorage.setItem('refreshToken', refreshToken);
        }
        if (githubToken) {
          localStorage.setItem('githubToken', githubToken);
        }
        setUser(user);
        setIsAuthenticated(true);
        
        // Set token expiry time
        try {
          const decoded = jwtDecode(token);
          setTokenExpiryTime(decoded.exp);
        } catch (error) {
          console.error('Token decode error:', error);
        }
        
        return { success: true, user };
      })
      .catch(error => {
        return { 
          success: false, 
          error: error.response?.data?.message || 'GitHub login failed' 
        };
      });
  }

  // Register function
  function register(userData) {
    return authAPI.register(userData)
      .then(response => {
        const { user, token, refreshToken } = response.data;
        localStorage.setItem('token', token);
        if (refreshToken) {
          localStorage.setItem('refreshToken', refreshToken);
        }
        setUser(user);
        setIsAuthenticated(true);
        
        // Set token expiry time
        try {
          const decoded = jwtDecode(token);
          setTokenExpiryTime(decoded.exp);
        } catch (error) {
          console.error('Token decode error:', error);
        }
        
        return { success: true, user };
      })
      .catch(error => {
        return { 
          success: false, 
          error: error.response?.data?.message || 'Registration failed' 
        };
      });
  }

  // Logout function
  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('githubToken');
    setUser(null);
    setIsAuthenticated(false);
    setTokenExpiryTime(null);
  }

  // Context value
  const value = {
    user,
    isAuthenticated,
    loading,
    tokenExpiryTime,
    login,
    register,
    logout,
    githubLogin,
    refreshAuth,
    reloadUser
  };

  // Return provider
  return (
    <AuthContext.Provider value={value}>
      {props.children}
    </AuthContext.Provider>
  );
}