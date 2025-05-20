import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectsAPI, filesAPI } from '../../../shared/services/api';
import { notifyWarning, notifyLoading, updateToast } from '../../../shared/utils/toast';
import { handleApiError } from '../../../shared/utils/errorHandler';

const RepoUpload = () => {
  const [repoUrl, setRepoUrl] = useState('');
  const [projectName, setProjectName] = useState('');
  const [branch, setBranch] = useState('main');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();

  const validateGitHubUrl = (url) => {
    // Basic GitHub URL validation
    const githubRegex = /^https:\/\/github\.com\/[\w-]+\/[\w.-]+$/i;
    return githubRegex.test(url);
  };

  const handleRepoUrlChange = (e) => {
    const url = e.target.value;
    setRepoUrl(url);
    
    // Extract repo name for project name suggestion
    if (url && !projectName) {
      try {
        // Extract repo name from GitHub URL
        // Example: https://github.com/username/repo-name
        const urlObj = new URL(url);
        if (urlObj.hostname === 'github.com') {
          const pathParts = urlObj.pathname.split('/').filter(Boolean);
          if (pathParts.length >= 2) {
            setProjectName(pathParts[1]);
          }
        }
      } catch (e) {
        // Invalid URL, do nothing
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!projectName.trim()) {
      notifyWarning('Please enter a project name');
      return;
    }
    
    if (!repoUrl.trim()) {
      notifyWarning('Please enter a GitHub repository URL');
      return;
    }
    
    if (!validateGitHubUrl(repoUrl)) {
      notifyWarning('Please enter a valid GitHub repository URL');
      return;
    }
    
    const toastId = notifyLoading('Creating project...');
    
    try {
      setUploading(true);
      
      // Create project
      const projectResponse = await projectsAPI.createProject({
        name: projectName,
        description: `GitHub repository: ${repoUrl}`,
        type: 'repository',
        repoUrl,
        branch
      });
      
      const projectId = projectResponse.data.id;
      
      updateToast(toastId, 'info', 'Project created. Cloning repository...');
      
      // Update progress
      setProgress(25);
      
      // Simulate repository cloning and processing
      if (import.meta.env.DEV) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        setProgress(50);
        
        await new Promise(resolve => setTimeout(resolve, 1500));
        setProgress(75);
        
        await new Promise(resolve => setTimeout(resolve, 1500));
        setProgress(100);
      } else {
        // Real API call to process repo
        await filesAPI.processRepository(projectId, { 
          url: repoUrl, 
          branch,
          onProgress: (progress) => setProgress(progress)
        });
      }
      
      updateToast(toastId, 'success', 'Repository processed successfully!');
      
      // Navigate to project page
      setTimeout(() => {
        navigate(`/project/${projectId}`);
      }, 1000);
      
    } catch (error) {
      handleApiError(error, {
        defaultMessage: 'Failed to process repository',
        showToast: false
      });
      updateToast(toastId, 'error', 
        error.response?.data?.message || 'Failed to process repository');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-center mb-8">Import GitHub Repository</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* GitHub Repository URL */}
        <div>
          <label htmlFor="repoUrl" className="block text-sm font-medium text-gray-700 mb-1">
            GitHub Repository URL
          </label>
          <input
            type="url"
            id="repoUrl"
            value={repoUrl}
            onChange={handleRepoUrlChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://github.com/username/repository"
            required
          />
          <p className="mt-1 text-xs text-gray-500">
            Example: https://github.com/facebook/react
          </p>
        </div>
        
        {/* Project name input */}
        <div>
          <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 mb-1">
            Project Name
          </label>
          <input
            type="text"
            id="projectName"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter project name"
            required
          />
        </div>
        
        {/* Branch input */}
        <div>
          <label htmlFor="branch" className="block text-sm font-medium text-gray-700 mb-1">
            Branch (Optional)
          </label>
          <input
            type="text"
            id="branch"
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="main"
          />
          <p className="mt-1 text-xs text-gray-500">
            Default: main
          </p>
        </div>
        
        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
            {error}
          </div>
        )}
        
        {/* Success message */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded relative">
            {success}
          </div>
        )}
        
        {/* Submit button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className={`px-6 py-2 rounded-md text-white ${
              loading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? 'Importing...' : 'Import Repository'}
          </button>
        </div>
      </form>
      
      {/* GitHub OAuth prompt if not authenticated with GitHub */}
      {import.meta.env.DEV && (
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-md p-4">
          <h3 className="font-medium text-blue-800">Development Mode</h3>
          <p className="text-sm text-blue-600 mt-1">
            In development mode, repository imports are simulated. In production, 
            actual GitHub API calls will be made and may require GitHub OAuth authentication.
          </p>
        </div>
      )}
    </div>
  );
};

export default RepoUpload;