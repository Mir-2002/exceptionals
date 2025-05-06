import axios from "axios";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();

  const userAPI = `${import.meta.env.VITE_API_ENDPOINT}/api/users`;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        console.log(user);
        try {
          const response = await axios.get(`${userAPI}/${user.uid}`);
          setCurrentUser(response.data);
          console.log(response.data);
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        console.log("No user found");
        setUser(null);
        setCurrentUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [auth]);
  return (
    <AuthContext.Provider value={{ user, currentUser, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
