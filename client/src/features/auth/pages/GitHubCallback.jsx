import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { notifyError, notifyLoading, updateToast } from '../../../shared/utils/toast';

const GitHubCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { githubLogin } = useAuth();
  const [status, setStatus] = useState('Processing GitHub authentication...');

  useEffect(() => {
    const handleGitHubCallback = async () => {
      // Extract authorization code from URL query parameters
      const searchParams = new URLSearchParams(location.search);
      const code = searchParams.get('code');
      const toastId = notifyLoading('Authenticating with GitHub...');
      
      if (!code) {
        setStatus('Error: No authorization code received from GitHub');
        updateToast(toastId, 'error', 'GitHub authentication failed: No code received');
        setTimeout(() => navigate('/login'), 3000);
        return;
      }
      
      try {
        // Send the code to your backend for token exchange
        const result = await githubLogin(code);
        
        if (result.success) {
          updateToast(toastId, 'success', 'Successfully authenticated with GitHub');
          
          // Check if the user was being redirected to a specific page
          const redirectTo = localStorage.getItem('redirectAfterLogin');
          localStorage.removeItem('redirectAfterLogin'); // Clean up
          
          // Navigate to the redirect destination or default to dashboard
          navigate(redirectTo || '/dashboard');
        } else {
          setStatus(`Authentication failed: ${result.error}`);
          updateToast(toastId, 'error', `GitHub authentication failed: ${result.error}`);
          setTimeout(() => navigate('/login'), 3000);
        }
      } catch (error) {
        setStatus('Error processing GitHub authentication');
        console.error('GitHub auth error:', error);
        updateToast(toastId, 'error', 'GitHub authentication failed');
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    handleGitHubCallback();
  }, [location, githubLogin, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
        <div className="animate-pulse mb-6">
          <div className="h-20 w-20 mx-auto bg-gray-200 rounded-full flex items-center justify-center">
            <svg className="h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
            </svg>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-3">GitHub Authentication</h2>
        <p className="text-gray-600 mb-4">{status}</p>
        <div className="mt-6 flex justify-center">
          <div className="w-8 h-8 border-t-2 border-b-2 border-gray-500 rounded-full animate-spin"></div>
        </div>
      </div>
    </div>
  );
};

export default GitHubCallback;