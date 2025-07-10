import React, { createContext, useContext, useState } from "react";

const RefreshContext = createContext();

export const useRefresh = () => {
  const context = useContext(RefreshContext);
  if (!context) {
    throw new Error("useRefresh must be used within a RefreshProvider");
  }
  return context;
};

export const RefreshProvider = ({ children }) => {
  const [refreshTriggers, setRefreshTriggers] = useState({});

  const triggerRefresh = (key) => {
    setRefreshTriggers((prev) => ({
      ...prev,
      [key]: Date.now(), // Use timestamp to ensure uniqueness
    }));
  };

  const getRefreshTrigger = (key) => {
    return refreshTriggers[key] || 0;
  };

  return (
    <RefreshContext.Provider value={{ triggerRefresh, getRefreshTrigger }}>
      {children}
    </RefreshContext.Provider>
  );
};
