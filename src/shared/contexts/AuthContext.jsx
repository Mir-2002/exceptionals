import React, { createContext, useContext, useState } from "react";

const AuthContext = createContext({});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  
  // Mock login function that just sets a user object locally
  const mockLogin = (email) => {
    setCurrentUser({
      email,
      username: email.split('@')[0],
    });
  };
  
  // Mock logout function
  const mockLogout = () => {
    setCurrentUser(null);
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