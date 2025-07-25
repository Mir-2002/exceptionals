import React, { useState, useEffect, useRef } from 'react';
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { filesAPI, projectsAPI } from '../../../shared/services/api';

const FileUpload = () => {
  const navigate = useNavigate();
  const { id: projectId } = useParams(); // Get project ID from URL
  const apiUrl = import.meta.env.VITE_API_ENDPOINT || "http://localhost:5000";
  
  const [project, setProject] = useState(null); // Add project state
  const [skipItems, setSkipItems] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [fileError, setFileError] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [processingStep, setProcessingStep] = useState(1);
  const [processingProgress, setProcessingProgress] = useState(0);
  const fileInputRef = useRef(null);

  // Fetch project details on component mount
  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await projectsAPI.getProjectById(projectId);
        setProject(response.data);
      } catch (error) {
        console.error('Error fetching project:', error);
        navigate('/dashboard'); // Redirect if project not found
      }
    };

    if (projectId) {
      fetchProject();
    }
  }, [projectId, navigate]);

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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFileError("");
    
    if (!file) {
      setSelectedFile(null);
      return;
    }
    
    // Check if file is a Python file
    if (!file.name.endsWith('.py') && !file.name.endsWith('.zip')) {
      setFileError("Only Python (.py) and ZIP (.zip) files are allowed");
      setSelectedFile(null);
      return;
    }
    
    setSelectedFile(file);
  };

  const handleContinue = (e) => {
    e.preventDefault();
    
    if (!selectedFile) {
      setFileError("Please select a Python file or ZIP archive");
      return;
    }
    
    handleFileUpload();
  };

  const handleFileUpload = async () => {
    setProcessingStep(2);
    setProcessingProgress(10);
    setIsUploading(true);

    try {
      // Upload file to existing project (don't create new project)
      const uploadResponse = await filesAPI.uploadFile(
        projectId, // Use existing project ID
        selectedFile,
        (progress) => {
          setProcessingProgress(30 + Math.round(progress * 0.5));
        }
      );
      
      setProcessingProgress(100);
      setProcessingStep(3);
      
    } catch (error) {
      console.error("Error uploading file:", error);
      setFileError("Error uploading file: " + (error.response?.data?.message || "Please try again."));
      setProcessingStep(1);
    } finally {
      setIsUploading(false);
    }
  };

  // Render the step content based on current processing step
  const renderStepContent = () => {
    switch (processingStep) {
      case 1: // Initial Upload
        return (
          <>
            <main className="flex flex-col md:flex-row w-full h-full font-funnel-sans">
              <section className="flex flex-col items-center justify-center w-full md:w-1/2 h-full p-10 md:p-20">
                <div className="w-full max-w-md">
                  <form
                    onSubmit={handleContinue}
                    className="flex flex-col items-center justify-center space-y-8"
                  >
                    <h1 className="text-3xl md:text-[2.5rem] font-bold font-funnel-display text-sky-700 text-center">
                      Upload Files to {project?.name}
                    </h1>
                    
                    <p className="text-gray-600 text-center">
                      Upload files for your project: <span className="font-medium text-sky-700">{project?.name}</span>
                    </p>
                    
                    <div className="w-full border-2 border-dashed border-sky-300 rounded-lg p-6 text-center hover:border-sky-500 transition-colors duration-200">
                      <input
                        ref={fileInputRef}
                        type="file"
                        id="file"
                        name="file"
                        accept=".py,.zip"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      
                      <div 
                        onClick={() => fileInputRef.current.click()}
                        className="cursor-pointer"
                      >
                        {!selectedFile ? (
                          <>
                            <div className="mb-4 flex justify-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <p className="font-medium text-sky-700">
                              Click to select Python files or ZIP
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              Supports .py files and .zip archives
                            </p>
                          </>
                        ) : (
                          <div className="p-3 bg-sky-50 rounded-lg text-left">
                            <div className="flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-sky-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <div>
                                <p className="font-medium text-sky-700">{selectedFile.name}</p>
                                <p className="text-xs text-gray-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                              </div>
                            </div>
                            <button 
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation(); 
                                setSelectedFile(null);
                                fileInputRef.current.value = null;
                              }}
                              className="mt-2 text-sm text-red-500 hover:text-red-700"
                            >
                              Remove file
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {fileError && (
                      <p className="text-red-500 text-center">{fileError}</p>
                    )}
                    
                    <button
                      type="submit"
                      disabled={isUploading || !selectedFile}
                      className={`bg-yellow-400 text-sky-700 px-5 py-3 rounded-lg font-medium w-full
                                transform hover:scale-105 transition duration-300 ease-in-out hover:bg-yellow-500 
                                hover:shadow-lg ${(isUploading || !selectedFile) ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      Upload Files
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
        
      case 2: // Processing
        return (
          <div className="container mx-auto px-6 py-20 max-w-2xl text-center">
            <h1 className="text-3xl font-bold text-sky-700 mb-10">Processing Your Files</h1>
            
            <div className="bg-white rounded-lg shadow-lg p-10">
              <div className="animate-pulse flex flex-col items-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
              
              <p className="text-xl font-medium text-gray-700 mb-6">
                Uploading files to <span className="font-bold text-sky-700">{project?.name}</span>
              </p>
              
              <div className="mb-4">
                <div className="h-2 w-full bg-gray-200 rounded-full">
                  <div 
                    className="h-2 bg-sky-500 rounded-full transition-all duration-300 ease-out" 
                    style={{ width: `${processingProgress}%` }}
                  ></div>
                </div>
              </div>
              
              <p className="text-gray-500">
                This will only take a moment...
              </p>
            </div>
          </div>
        );
        
      case 3: // Complete - Navigate to exclusions
        return (
          <div className="container mx-auto px-6 py-20 max-w-2xl text-center">
            <h1 className="text-3xl font-bold text-sky-700 mb-10">Files Uploaded Successfully!</h1>
            
            <div className="bg-white rounded-lg shadow-lg p-10">
              <div className="flex justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <p className="text-xl font-medium text-gray-700 mb-6">
                Files have been uploaded to <span className="font-bold text-sky-700">{project?.name}</span>
              </p>
              
              <p className="text-gray-600 mb-8">
                Next, you can set exclusions for what to skip during documentation generation.
              </p>
              
              <div className="flex flex-col md:flex-row justify-center space-y-4 md:space-y-0 md:space-x-4">
                <button
                  onClick={() => navigate(`/project/${projectId}/exclusions`)}
                  className="bg-yellow-600 text-white px-5 py-3 rounded-lg font-medium hover:bg-yellow-700 transition-colors"
                >
                  Set Exclusions
                </button>
                <button
                  onClick={() => navigate(`/project/${projectId}`)}
                  className="bg-white text-sky-700 border border-sky-300 px-5 py-3 rounded-lg font-medium hover:bg-sky-50 transition-colors"
                >
                  Back to Project
                </button>
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  if (!project) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
      </div>
    );
  }

  return renderStepContent();
};

export default FileUpload;