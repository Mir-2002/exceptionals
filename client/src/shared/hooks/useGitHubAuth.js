import { useState, useEffect } from 'react';
import axios from 'axios';
import { notifyError, notifyLoading, updateToast } from '../utils/toast';

export function useGitHubAuth() {
  const [githubUser, setGithubUser] = useState(null);
  const [repositories, setRepositories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  
  // Check for existing token on load
  useEffect(() => {
    const token = localStorage.getItem('github_token');
    if (token) {
      setLoading(true);
      fetchGitHubUser(token)
        .then(() => setConnected(true))
        .catch(() => localStorage.removeItem('github_token'))
        .finally(() => setLoading(false));
    }
  }, []);
  
  // Start GitHub OAuth flow
  const initiateGitHubAuth = () => {
    const githubClientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
    const redirectUri = import.meta.env.VITE_GITHUB_REDIRECT_URI;
    const scopes = 'user:email,repo';
    
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${githubClientId}&redirect_uri=${redirectUri}&scope=${scopes}`;
    window.location.href = githubAuthUrl;
  };
  
  // Handle the OAuth callback
  const handleCallback = async (code) => {
    const toastId = notifyLoading('Connecting to GitHub...');
    setLoading(true);
    
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_ENDPOINT}/api/auth/github/callback`, 
        { code }
      );
      
      if (response.data && response.data.access_token) {
        const token = response.data.access_token;
        localStorage.setItem('github_token', token);
        await fetchGitHubUser(token);
        setConnected(true);
        updateToast(toastId, 'success', 'Connected to GitHub successfully!');
        return true;
      } else {
        throw new Error('No access token received');
      }
    } catch (error) {
      console.error('GitHub auth error:', error);
      updateToast(toastId, 'error', 'Failed to connect to GitHub');
      notifyError(error.response?.data?.message || 'Failed to connect to GitHub');
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch user info and repos
  const fetchGitHubUser = async (token) => {
    try {
      const userResponse = await axios.get('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setGithubUser(userResponse.data);
      
      const reposResponse = await axios.get('https://api.github.com/user/repos', {
        headers: { Authorization: `Bearer ${token}` },
        params: { sort: 'updated', per_page: 100 }
      });
      
      setRepositories(reposResponse.data);
    } catch (error) {
      console.error('Error fetching GitHub data:', error);
      notifyError('Failed to fetch GitHub profile or repositories');
      throw error;
    }
  };
  
  return {
    githubUser,
    repositories,
    loading,
    connected,
    initiateGitHubAuth,
    handleCallback,
    disconnectGitHub: () => {
      localStorage.removeItem('github_token');
      setGithubUser(null);
      setRepositories([]);
      setConnected(false);
    },
    fetchRepository: async (owner, repo) => {
      const token = localStorage.getItem('github_token');
      if (!token) {
        notifyError('GitHub connection required');
        return null;
      }
      
      try {
        const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
      } catch (error) {
        console.error('Error fetching repository:', error);
        notifyError('Failed to fetch repository details');
        return null;
      }
    }
  };
}