import React from "react";
import Heading from "./Heading";
import { useAuth } from "../contexts/AuthContext";

const Header = () => {
  const { user, logout } = useAuth();

  return (
    <header className="w-full flex flex-row items-center justify-between p-5">
      <Heading className="text-2xl">Exceptionals</Heading>
      <div className="flex items-center gap-4">
        {user && (
          <span className="text-gray-700 font-medium">
            Welcome, {user.username || user.email || "User"}
          </span>
        )}
        <button
          className="bg-red-500 text-white px-4 py-2 rounded"
          onClick={logout}
        >
          Logout
        </button>
      </div>
    </header>
  );
};

export default Header;
