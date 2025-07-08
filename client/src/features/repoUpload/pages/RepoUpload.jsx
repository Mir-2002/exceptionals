import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectsAPI } from '../../../shared/services/api';
import { useGitHubAuth } from '../../../shared/hooks/useGithubAuth';
import { notifyError, notifyLoading, updateToast } from '../../../shared/utils/toast';
import LoadingSpinner from '../../../shared/components/LoadingSpinner';

const RepoUpload = () => {
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [branch, setBranch] = useState('main');
  const [projectName, setProjectName] = useState('');
  const [branches, setBranches] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [processingStep, setProcessingStep] = useState(1);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [skipItems, setSkipItems] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const navigate = useNavigate();
  
  const { 
    repositories, 
    loading, 
    connected, 
    initiateGitHubAuth, 
    fetchRepository 
  } = useGitHubAuth();

  const handleAddItem = (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      setSkipItems([...skipItems, inputValue.trim()]);
      setInputValue("");
    }
  };

  const handleRemoveItem = (item) => {
    setSkipItems(skipItems.filter(skipItem => skipItem !== item));
  };
  
  const handleRepoSelect = async (repo) => {
    setSelectedRepo(repo);
    setProjectName(repo.name);
    
    try {
      // Fetch branches for the selected repository
      const branchesUrl = repo.branches_url.replace('{/branch}', '');
      const response = await fetch(branchesUrl, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('github_token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch branches');
      
      const branchData = await response.json();
      setBranches(branchData.map(branch => branch.name));
      
      // Default to 'main' or 'master' if it exists
      if (branchData.find(b => b.name === 'main')) setBranch('main');
      else if (branchData.find(b => b.name === 'master')) setBranch('master');
      else if (branchData.length > 0) setBranch(branchData[0].name);
    } catch (err) {
      console.error('Error fetching branches:', err);
      notifyError('Failed to fetch repository branches');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedRepo) {
      setError('Please select a repository');
      return;
    }

    if (!projectName.trim()) {
      setError('Please enter a project name');
      return;
    }

    const toastId = notifyLoading('Creating project...');
    
    try {
      setProcessing(true);
      setProcessingStep(2);
      setProcessingProgress(10);
      setError('');

      // Create project with GitHub repo information
      const projectData = {
        name: projectName,
        source: {
          type: 'github',
          url: selectedRepo.html_url,
          branch: branch,
          repoId: selectedRepo.id,
          accessToken: localStorage.getItem('github_token')
        },
        skipItems: skipItems
      };
      
      // In development, we'll simulate the API call
      if (import.meta.env.DEV) {
        // Simulate processing
        await new Promise(resolve => setTimeout(resolve, 1000));
        setProcessingProgress(30);
        await new Promise(resolve => setTimeout(resolve, 1000));
        setProcessingProgress(60);
        await new Promise(resolve => setTimeout(resolve, 1000));
        setProcessingProgress(90);
        await new Promise(resolve => setTimeout(resolve, 500));
        setProcessingProgress(100);
        
        // Store mock project ID
        const mockProjectId = 'github-' + Date.now();
        localStorage.setItem('lastProjectId', mockProjectId);
        
        setProcessingStep(3);
        setTimeout(() => {
          navigate(`/project/${mockProjectId}`);
        }, 1500);
      } else {
        // Real API call
        const response = await projectsAPI.createProject(projectData);
        const projectId = response.data.id;
        
        updateToast(toastId, 'info', 'Project created. Processing repository...');
        
        // Poll for processing status
        const pollInterval = setInterval(async () => {
          try {
            const statusResponse = await projectsAPI.getProjectStatus(projectId);
            const progress = statusResponse.data.progress || 0;
            setProcessingProgress(progress);
            
            if (progress === 100) {
              clearInterval(pollInterval);
              setProcessingStep(3);
              updateToast(toastId, 'success', 'Repository processed successfully!');
              
              // Navigate to project page after a short delay
              setTimeout(() => {
                navigate(`/project/${projectId}`);
              }, 1500);
            }
          } catch (err) {
            console.error('Error polling project status:', err);
            clearInterval(pollInterval);
            throw err;
          }
        }, 2000);
      }
    } catch (err) {
      console.error("Error processing GitHub repository:", err);
      setError("Failed to process repository: " + (err.response?.data?.message || "Please try again later"));
      setProcessingStep(1);
      updateToast(toastId, 'error', 'Failed to process repository');
    } finally {
      setProcessing(false);
    }
  };
  
  // If user isn't connected to GitHub, show the connection screen
  if (!connected) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen p-6">
        <h1 className="text-3xl font-bold text-sky-800 mb-8">Connect to GitHub</h1>
        <div className="bg-white shadow-md rounded-lg p-8 max-w-md w-full">
          <p className="mb-6 text-gray-700">
            To analyze GitHub repositories, you need to connect your GitHub account first.
            This will allow us to access your repositories and generate documentation.
          </p>
          
          <div className="mb-8">
            <h2 className="font-semibold mb-2">Required permissions:</h2>
            <ul className="list-disc ml-5 text-gray-700">
              <li>Read your user profile</li>
              <li>List your repositories</li>
              <li>Access repository content</li>
            </ul>
          </div>
          
          <button
            onClick={initiateGitHubAuth}
            className="w-full flex items-center justify-center bg-gray-800 hover:bg-gray-900 text-white px-6 py-3 rounded-lg"
            disabled={loading}
          >
            {loading ? (
              <LoadingSpinner size="small" color="white" />
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="mr-2">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                Connect with GitHub
              </>
            )}
          </button>
        </div>
      </main>
    );
  }

  // Processing screen
  if (processingStep > 1) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen p-6">
        <div className="bg-white shadow-md rounded-lg p-8 max-w-md w-full">
          <h2 className="text-2xl font-semibold text-center mb-6">
            {processingStep === 2 ? "Processing Repository..." : "Processing Complete!"}
          </h2>
          
          <div className="mb-8">
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">Progress</span>
              <span className="text-sm font-medium">{processingProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                style={{ width: `${processingProgress}%` }}
              ></div>
            </div>
          </div>
          
          {processingStep === 3 && (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-gray-700 mb-6">Repository processed successfully!</p>
              <p className="text-gray-500 text-sm">You'll be redirected to the project page shortly...</p>
            </div>
          )}
        </div>
      </main>
    );
  }

  // Main UI when connected and ready to select a repo
  return (
    <main className="flex flex-col md:flex-row w-full h-full font-funnel-sans">
      <section className="flex flex-col items-start w-full md:w-1/2 h-full p-10 md:p-20">
        <h2 className="text-xl md:text-[2rem] font-bold font-funnel-display text-sky-700 mb-8">
          Select GitHub Repository
        </h2>
        
        {loading ? (
          <div className="flex justify-center items-center w-full py-20">
            <LoadingSpinner size="large" />
          </div>
        ) : (
          <div className="w-full space-y-4 max-h-[60vh] overflow-y-auto pr-4">
            {repositories.length > 0 ? (
              repositories.map(repo => (
                <div 
                  key={repo.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedRepo && selectedRepo.id === repo.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                  onClick={() => handleRepoSelect(repo)}
                >
                  <h3 className="font-medium text-lg">{repo.name}</h3>
                  <p className="text-gray-600 text-sm">{repo.description || 'No description'}</p>
                  <div className="flex items-center mt-2 text-xs text-gray-500">
                    <span className="flex items-center mr-4">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z"></path>
                      </svg>
                      {repo.stargazers_count}
                    </span>
                    <span className="flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z"></path>
                      </svg>
                      {repo.forks_count}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10">
                <p className="text-gray-500">No repositories found in your GitHub account.</p>
              </div>
            )}
          </div>
        )}
      </section>
      
      <section className="flex flex-col items-center justify-center w-full md:w-1/2 h-full p-10 md:p-20">
        {selectedRepo ? (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col items-center justify-center space-y-8 w-full max-w-md"
          >
            <h2 className="text-xl md:text-[2rem] font-bold font-funnel-display text-sky-700">
              Repository Configuration
            </h2>
            
            <div className="w-full">
              <label htmlFor="projectName" className="block mb-2 font-medium text-gray-700">Project Name</label>
              <input
                type="text"
                id="projectName"
                placeholder="Enter project name"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-sky-500 focus:border-sky-500"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
              />
            </div>
            
            {branches.length > 0 && (
              <div className="w-full">
                <label htmlFor="branch" className="block mb-2 font-medium text-gray-700">Branch</label>
                <select
                  id="branch"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-sky-500 focus:border-sky-500"
                >
                  {branches.map(branchName => (
                    <option key={branchName} value={branchName}>{branchName}</option>
                  ))}
                </select>
              </div>
            )}
            
            {/* Skip items section */}
            <div className="w-full">
              <label htmlFor="skipItem" className="block mb-2 font-medium text-gray-700">
                Skip Functions/Classes (Optional)
              </label>
              <div className="flex items-center">
                <input
                  type="text"
                  id="skipItem"
                  placeholder="Function/class name"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="flex-grow p-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <button
                  onClick={handleAddItem}
                  type="button" // Prevent form submission
                  className="px-4 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
              
              {skipItems.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm text-gray-700 mb-2">Items to skip:</p>
                  <div className="flex flex-wrap gap-2">
                    {skipItems.map((item, index) => (
                      <div key={index} className="bg-gray-100 px-3 py-1 rounded-full flex items-center">
                        <span className="text-sm">{item}</span>
                        <button
                          onClick={() => handleRemoveItem(item)}
                          type="button" // Prevent form submission
                          className="ml-2 text-gray-500 hover:text-red-500"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {error && <p className="text-red-500 text-center">{error}</p>}
            
            <button
              type="submit"
              disabled={processing || !selectedRepo}
              className={`bg-yellow-400 text-sky-700 px-5 py-3 rounded-lg font-medium w-full
                       transform hover:scale-105 transition duration-300 ease-in-out hover:bg-yellow-500 
                       hover:shadow-lg ${(processing || !selectedRepo) ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {processing ? "Processing Repository..." : "Start Analysis"}
            </button>
          </form>
        ) : (
          <div className="text-center">
            <h3 className="text-xl font-medium text-gray-700 mb-3">Select a repository</h3>
            <p className="text-gray-500">Choose a repository from the list to configure your analysis</p>
          </div>
        )}
      </section>
    </main>
  );
};

export default RepoUpload;