import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authAPI } from '../../../shared/services/api';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { notifyLoading, updateToast } from '../../../shared/utils/toast';
import { handleApiError } from '../../../shared/utils/errorHandler';

const GitHubCallback = () => {
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  
  useEffect(() => {
    const handleGitHubCallback = async () => {
      // Get the code from the URL
      const queryParams = new URLSearchParams(location.search);
      const code = queryParams.get('code');
      
      if (!code) {
        navigate('/login');
        return;
      }
      
      const toastId = notifyLoading('Authenticating with GitHub...');
      
      try {
        setLoading(true);
        
        // Call your backend API to handle GitHub authorization
        const response = await authAPI.githubLogin(code);
        
        // Update auth context
        login(response.data);
        
        updateToast(toastId, 'success', 'Logged in with GitHub successfully!');
        
        // Redirect to dashboard
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      } catch (error) {
        handleApiError(error, {
          defaultMessage: 'GitHub authentication failed',
          showToast: false
        });
        updateToast(toastId, 'error', 'GitHub authentication failed');
        
        // Redirect to login
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } finally {
        setLoading(false);
      }
    };
    
    handleGitHubCallback();
  }, [location.search]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Authenticating with GitHub
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Please wait while we authenticate your GitHub account
          </p>
        </div>
        
        <div className="mt-8 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    </div>
  );
};

export default GitHubCallback;