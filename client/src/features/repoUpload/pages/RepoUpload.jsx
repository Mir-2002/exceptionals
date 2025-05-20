import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectsAPI } from '../../../shared/services/api';

const RepoUpload = () => {
  const [repoUrl, setRepoUrl] = useState('');
  const [branch, setBranch] = useState('main');
  const [projectName, setProjectName] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [processingStep, setProcessingStep] = useState(1);
  const [processingProgress, setProcessingProgress] = useState(0);
  const navigate = useNavigate();

  const validateGitHubUrl = (url) => {
    // Simple GitHub URL validation
    const githubRegex = /^https?:\/\/(www\.)?github\.com\/[\w-]+\/[\w.-]+\/?$/;
    return githubRegex.test(url);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateGitHubUrl(repoUrl)) {
      setError('Please enter a valid GitHub repository URL');
      return;
    }

    if (!projectName.trim()) {
      setError('Please enter a project name');
      return;
    }

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
          url: repoUrl,
          branch: branch
        }
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
        
        setProcessingProgress(100);
        setProcessingStep(3);
        
        // Store project ID for later use
        localStorage.setItem('lastProjectId', projectId);
        
        // Navigate to project page after a short delay
        setTimeout(() => {
          navigate(`/project/${projectId}`);
        }, 1500);
      }
    } catch (err) {
      console.error("Error processing GitHub repository:", err);
      setError("Failed to process repository: " + (err.response?.data?.message || "Please try again later"));
      setProcessingStep(1);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <header className="w-full p-6 bg-white shadow-sm">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-bold text-sky-800">GitHub Repository Analysis</h1>
          <button 
            onClick={() => navigate('/upload-selection')} 
            className="px-4 py-2 text-sky-700 hover:underline"
          >
            Back to Upload Selection
          </button>
        </div>
      </header>
      
      <main className="flex flex-col md:flex-row w-full h-full font-funnel-sans">
        <section className="flex flex-col items-center justify-center w-full md:w-1/2 h-full p-10 md:p-20">
          <div className="w-full max-w-md">
            <form
              onSubmit={handleSubmit}
              className="flex flex-col items-center justify-center space-y-8"
            >
              <h2 className="text-xl md:text-[2rem] font-bold font-funnel-display text-sky-700 text-center">
                Analyze GitHub Repository
              </h2>
              
              <div className="w-full">
                <label htmlFor="repoUrl" className="block mb-2 font-medium text-gray-700">Repository URL</label>
                <div className="flex">
                  <input
                    type="url"
                    id="repoUrl"
                    placeholder="https://github.com/username/repository"
                    className="flex-grow p-3 border border-gray-300 rounded-l-lg focus:ring-sky-500 focus:border-sky-500"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                  />
                </div>
                <p className="mt-1 text-sm text-gray-500">Enter the full URL to a GitHub repository</p>
              </div>

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
              
              {error && <p className="text-red-500 text-center">{error}</p>}
              
              <button
                type="submit"
                disabled={processing || !repoUrl}
                className={`bg-yellow-400 text-sky-700 px-5 py-3 rounded-lg font-medium w-full
                         transform hover:scale-105 transition duration-300 ease-in-out hover:bg-yellow-500 
                         hover:shadow-lg ${(processing || !repoUrl) ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {processing ? "Processing Repository..." : "Start Analysis"}
              </button>
            </form>
          </div>
        </section>
        
        <section className="flex flex-col items-center justify-center w-full md:w-1/2 h-full p-10 md:p-20">
          <form
            onSubmit={handleAddItem}
            className="flex flex-col items-center justify-center space-y-10"
          >
            <label
              htmlFor="skipItem"
              className="text-[2rem] font-bold font-funnel-display text-sky-700"
            >
              Enter function/class names to skip
            </label>
            <p className="w-3/4 text-center">
              Case-insensitive but include underscores or dashes if it does
              include them.{" "}
              <span className="font-medium">eg. add_item, delete-item</span>
            </p>
            <input
              type="text"
              id="skipItem"
              placeholder="Function/Class"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="border-b border-gray-400 w-1/3 p-2 focus:outline-none focus:border-b-2 focus:w-1/2 transition-all duration-100"
            />
            <button
              type="submit"
              className="bg-yellow-400 text-sky-700 px-5 py-2 rounded-lg font-medium
                       transform hover:scale-105 transition duration-300 ease-in-out hover:bg-yellow-500 
                       hover:shadow-lg"
            >
              Add
            </button>
          </form>
          <ul className="mt-10">
            {skipItems.map((item, index) => (
              <li
                key={index}
                className="flex items-center justify-between w-full p-2 border-b border-gray-300"
              >
                <span>{item}</span>
                <button
                  onClick={() => handleRemoveItem(item)}
                  className="ml-5 text-red-500 hover:text-red-700 cursor-pointer transition duration-300"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </>
  );
};

export default RepoUpload;