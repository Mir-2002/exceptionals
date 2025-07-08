import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const [showPopup, setShowPopup] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      setShowPopup(true);
    }
  }, [loading, isAuthenticated]);

  const handleRedirectToLogin = () => {
    setShowPopup(false);
    setShouldRedirect(true);
  };

  const handleRedirectToRegister = () => {
    setShowPopup(false);
    window.location.href = '/register';
  };

  const handleClose = () => {
    setShowPopup(false);
    window.location.href = '/';
  };

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-sky-800"></div>
      </div>
    );
  }

  // Redirect only after user interaction
  if (shouldRedirect) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If not authenticated, show popup (without automatic redirect)
  if (!isAuthenticated) {
    return (
      <>
        {/* Popup Modal with blurred background */}
        {showPopup && (
          <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex justify-center items-center z-50">
            <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md mx-4 border border-gray-100">
              <div className="text-center">
                {/* Lock Icon */}
                <div className="mx-auto h-16 w-16 bg-sky-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="h-8 w-8 text-sky-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 0h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                
                <h2 className="text-2xl font-bold text-sky-800 mb-2 font-funnel-display">Authentication Required</h2>
                <p className="text-gray-600 mb-6 font-work-sans">Please log in or sign up to access the dashboard and start creating documentation.</p>
                
                <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
                  <button
                    onClick={handleRedirectToLogin}
                    className="bg-sky-800 text-white px-6 py-3 rounded-lg hover:bg-sky-900 transition-colors font-work-sans font-medium"
                  >
                    Log In
                  </button>
                  <button
                    onClick={handleRedirectToRegister}
                    className="bg-yellow-400 text-sky-800 px-6 py-3 rounded-lg hover:bg-yellow-500 transition-colors font-work-sans font-medium"
                  >
                    Sign Up
                  </button>
                </div>
                
                <button
                  onClick={handleClose}
                  className="text-gray-500 hover:text-gray-700 text-sm font-work-sans transition-colors"
                >
                  ← Back to Home
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Background content with blur effect */}
        <div className="min-h-screen bg-gray-50">
          {/* You can add some background content here if needed */}
        </div>
      </>
    );
  }

  return children;
};

export default ProtectedRoute;