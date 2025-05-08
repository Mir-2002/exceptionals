import React, { createContext, useState, useContext, useEffect } from 'react';

// Create Auth Context
const AuthContext = createContext();

// Provider component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);

  // Check for saved user on initial load
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
  }, []);

  // Login function
  const login = (email) => {
    console.log("AuthContext login called with:", email);
    const user = {
      email,
      username: email.split('@')[0],
    };
    localStorage.setItem('user', JSON.stringify(user));
    setCurrentUser(user);
    return true;
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('user');
    setCurrentUser(null);
    return true;
  };

  const value = {
    currentUser,
    login,
    logout,
  };

  console.log("Auth context value:", value); // Debug log

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  // Add debugging
  if (!context) {
    console.error("useAuth must be used within an AuthProvider");
    return { 
      currentUser: null, 
      login: null,
      logout: null
    };
  }
  
  console.log("Auth context being used:", context);
  return context;
};