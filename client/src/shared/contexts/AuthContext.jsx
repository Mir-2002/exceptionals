import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { authAPI } from '../services/api';
import { jwtDecode } from 'jwt-decode';

// Create auth context with default value
const AuthContext = createContext({
  currentUser: null,
  isAuthenticated: false,
  loading: true,
  logout: () => {}
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Add debug logs inside the component
  console.log('🔍 Debug - Token in localStorage:', localStorage.getItem('token'));
  console.log('🔍 Debug - UserInfo in localStorage:', localStorage.getItem('userInfo'));
  console.log('🔍 Debug - Current user object:', user);
  console.log('🔍 Debug - IsAuthenticated:', isAuthenticated);

  // Simplified token check without refresh logic
  const checkToken = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false);
      return;
    }

    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      
      if (decoded.exp < currentTime) {
        // Token expired, clear it
        localStorage.removeItem('token');
        localStorage.removeItem('userInfo');
        setUser(null);
        setIsAuthenticated(false);
      } else {
        // Get stored user info
        const storedUserInfo = localStorage.getItem('userInfo');
        if (storedUserInfo) {
          setUser(JSON.parse(storedUserInfo));
        } else {
          setUser(decoded);
        }
        setIsAuthenticated(true);
      }
    } catch (err) {
      console.error('Token decode error:', err);
      localStorage.removeItem('token');
      localStorage.removeItem('userInfo');
      setUser(null);
      setIsAuthenticated(false);
    }
    
    setLoading(false);
  }, []);

  // Check token on mount
  useEffect(() => {
    checkToken();
  }, [checkToken]);

  const login = async (credentials) => {
    const response = await authAPI.login(credentials);
    const token = response.data.access_token;
    
    localStorage.setItem('token', token);
    
    // Store the user info from login response
    const userInfo = {
      username: response.data.username,
      user_id: response.data.user_id,
      expires_at: response.data.expires_at
    };
    
    localStorage.setItem('userInfo', JSON.stringify(userInfo));
    
    setUser(userInfo);
    setIsAuthenticated(true);
    
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userInfo');
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    currentUser: user,
    isAuthenticated,
    loading,
    login,
    logout
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};