import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../../shared/contexts/AuthContext";

const RepoUpload = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [skipItems, setSkipItems] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("main");
  const [availableBranches, setAvailableBranches] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [fetchingBranches, setFetchingBranches] = useState(false);
  
  // Get user from localStorage
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;

  const handleAddItem = (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      setSkipItems([...skipItems, inputValue]);
      setInputValue("");
    }
  };

  const handleRemoveItem = (item) => {
    setSkipItems(skipItems.filter((skipItem) => skipItem !== item));
  };

  const fetchBranches = async () => {
    if (!repoUrl) return;
    
    setFetchingBranches(true);
    setError("");
    
    // Try to extract owner and repo from URL
    try {
      const urlObject = new URL(repoUrl);
      const pathSegments = urlObject.pathname.split('/').filter(Boolean);
      
      if (pathSegments.length < 2) {
        setError("Invalid GitHub repository URL format");
        setFetchingBranches(false);
        return;
      }
      
      const owner = pathSegments[0];
      const repo = pathSegments[1];
      
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_ENDPOINT}/api/github/repos/${owner}/${repo}/branches`
        );
        
        if (response.data && response.data.branches) {
          setAvailableBranches(response.data.branches);
          // Set default branch if available
          if (response.data.defaultBranch) {
            setSelectedBranch(response.data.defaultBranch);
          } else if (response.data.branches.length > 0) {
            setSelectedBranch(response.data.branches[0]);
          }
        }
      } catch (error) {
        console.error("Error fetching branches:", error);
        setError("Failed to fetch repository branches. Make sure the repository exists and is public.");
      }
    } catch (error) {
      setError("Please enter a valid GitHub repository URL");
    } finally {
      setFetchingBranches(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      alert("Please login to analyze repositories");
      return;
    }
    
    if (!repoUrl) {
      setError("Please enter a GitHub repository URL");
      return;
    }
    
    // Validate URL
    try {
      const urlObject = new URL(repoUrl);
      if (!urlObject.hostname.includes("github.com")) {
        setError("Please enter a valid GitHub repository URL");
        return;
      }
      
      const pathSegments = urlObject.pathname.split('/').filter(Boolean);
      if (pathSegments.length < 2) {
        setError("Invalid GitHub repository URL format");
        return;
      }
      
      const owner = pathSegments[0];
      const repo = pathSegments[1];
      
      setIsLoading(true);
      setError("");
      
      try {
        const response = await axios.post(
          `${import.meta.env.VITE_API_ENDPOINT}/api/users/${user.uid}/github/analyze`,
          {
            owner,
            repo,
            branch: selectedBranch,
            skip_list: skipItems
          },
          {
            headers: {
              Authorization: `Bearer ${user?.token || ''}`
            }
          }
        );
        
        // Navigate to results page or show success message
        if (response.data && response.data.jobId) {
          navigate(`/analysis/${response.data.jobId}`);
        } else {
          alert("Repository analysis started successfully!");
          navigate("/dashboard");
        }
      } catch (error) {
        console.error("Error analyzing repository:", error);
        setError(error.response?.data?.message || "Error analyzing repository");
      } finally {
        setIsLoading(false);
      }
    } catch (error) {
      setError("Please enter a valid GitHub repository URL");
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
                  <button
                    type="button"
                    onClick={fetchBranches}
                    className="px-4 py-3 bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg hover:bg-gray-200"
                  >
                    Get branches
                  </button>
                </div>
                <p className="mt-1 text-sm text-gray-500">Enter the full URL to a GitHub repository</p>
              </div>
              
              {fetchingBranches && (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-sky-700"></div>
                  <span className="ml-2 text-gray-600">Fetching branches...</span>
                </div>
              )}
              
              {availableBranches.length > 0 && (
                <div className="w-full">
                  <label htmlFor="branch" className="block mb-2 font-medium text-gray-700">Select Branch</label>
                  <select
                    id="branch"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-sky-500 focus:border-sky-500"
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                  >
                    {availableBranches.map(branch => (
                      <option key={branch} value={branch}>
                        {branch}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              {error && <p className="text-red-500 text-center">{error}</p>}
              
              <button
                type="submit"
                disabled={isLoading || !repoUrl}
                className={`bg-yellow-400 text-sky-700 px-5 py-3 rounded-lg font-medium w-full
                         transform hover:scale-105 transition duration-300 ease-in-out hover:bg-yellow-500 
                         hover:shadow-lg ${(isLoading || !repoUrl) ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {isLoading ? "Analyzing Repository..." : "Start Analysis"}
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