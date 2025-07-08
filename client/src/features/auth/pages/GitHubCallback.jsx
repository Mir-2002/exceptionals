import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useGitHubAuth } from '../../../shared/hooks/useGitHubAuth';
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner';

const GitHubCallback = () => {
  const [error, setError] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const { handleCallback } = useGitHubAuth();
  
  useEffect(() => {
    const handleOAuthCallback = async () => {
      // Extract code from URL
      const params = new URLSearchParams(location.search);
      const code = params.get('code');
      
      if (!code) {
        setError('No authorization code received from GitHub');
        return;
      }
      
      try {
        await handleCallback(code);
        // Redirect to repository selection page
        navigate('/repo-upload');
      } catch (err) {
        setError('Failed to complete GitHub authentication');
        console.error('GitHub callback error:', err);
      }
    };
    
    handleOAuthCallback();
  }, [location, navigate, handleCallback]);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      {!error ? (
        <div className="text-center p-8">
          <LoadingSpinner size="large" />
          <h2 className="text-xl font-semibold mt-4">Connecting to GitHub...</h2>
          <p className="text-gray-500">Please wait while we complete the authentication process</p>
        </div>
      ) : (
        <div className="text-center p-8">
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
            <p className="text-red-700">{error}</p>
          </div>
          <button
            onClick={() => navigate('/repo-upload')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mt-4"
          >
            Back to Upload
          </button>
        </div>
      )}
    </div>
  );
};

export default GitHubCallback;