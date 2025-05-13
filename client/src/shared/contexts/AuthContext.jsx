import React, { createContext, useContext, useState } from "react";

const AuthContext = createContext({});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  
  const setAuthUser = (user, token) => {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);
    setCurrentUser(user);
  };

  const clearAuth = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setCurrentUser(null);
  };

  // Mock login function that just sets a user object locally
  const mockLogin = (email) => {
    const user = {
      email,
      username: email.split('@')[0],
    };
    setAuthUser(user, 'mockToken');
  };
  
  // Mock logout function
  const mockLogout = () => {
    clearAuth();
  };

  return (
    <AuthContext.Provider value={{ 
      currentUser, 
      login: mockLogin,
      logout: mockLogout 
    }}>
      {children}
    </AuthContext.Provider>
  );
}