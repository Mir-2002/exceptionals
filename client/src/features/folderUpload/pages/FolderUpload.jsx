import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { filesAPI, projectsAPI } from '../../../shared/services/api';

const FolderUpload = () => {
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_ENDPOINT || "http://localhost:5000";
  
  const [skipItems, setSkipItems] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [fileCount, setFileCount] = useState({ total: 0, python: 0 });
  const [projectName, setProjectName] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [processingStep, setProcessingStep] = useState(1); // 1: Upload, 2: Selection, 3: Processing, 4: Complete
  const [processingProgress, setProcessingProgress] = useState(0);
  const folderInputRef = useRef(null);

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

  const handleFolderSelect = (e) => {
    const files = e.target.files;
    let totalCount = files.length;
    let pythonCount = 0;
    const pythonFiles = [];

    for (let i = 0; i < files.length; i++) {
      if (files[i].name.endsWith('.py')) {
        pythonCount++;
        pythonFiles.push({
          name: files[i].name,
          path: files[i].webkitRelativePath,
          size: files[i].size,
          selected: true // Initially selected
        });
      }
    }

    setFileCount({ total: totalCount, python: pythonCount });
    setSelectedFiles(pythonFiles);
    
    // Try to extract project name from the folder name
    if (files.length > 0) {
      const folderName = files[0].webkitRelativePath.split('/')[0];
      setProjectName(folderName);
    }
    
    if (pythonCount === 0) {
      setUploadError("No Python files found in the selected folder");
    } else {
      setUploadError("");
    }
  };

  const toggleFileSelection = (filePath) => {
    setSelectedFiles(prevFiles => 
      prevFiles.map(file => 
        file.path === filePath 
          ? { ...file, selected: !file.selected } 
          : file
      )
    );
  };

  const handleContinue = (e) => {
    e.preventDefault();
    if (fileCount.python === 0) {
      setUploadError("Please select a folder with Python files");
      return;
    }
    
    if (!projectName.trim()) {
      setUploadError("Please enter a project name");
      return;
    }
    
    setProcessingStep(2);
  };

  const handleFolderUpload = async () => {
    setProcessingStep(2);
    setProcessingProgress(10);
    setIsUploading(true);
  
    try {
      // Create a new project first
      const projectResponse = await projectsAPI.createProject({ 
        name: projectName 
      });
      
      const projectId = projectResponse.data.id;
      setProcessingProgress(30);
      
      // Prepare files for upload
      const formData = new FormData();
      
      // Add all files from the folder
      for (const file of selectedFiles) {
        formData.append('files', file);
      }
      
      // Use ZIP file upload since we're dealing with multiple files
      const uploadResponse = await filesAPI.uploadZipFile(
        projectId, 
        formData,
        (progress) => {
          // Update progress based on upload status
          setProcessingProgress(30 + Math.round(progress * 0.5));
        }
      );
      
      setProcessingProgress(100);
      setProcessingStep(3);
      
      // Store project ID for later use
      localStorage.setItem('lastProjectId', projectId);
    } catch (error) {
      console.error("Error uploading folder:", error);
      setFolderError("Error uploading folder: " + (error.response?.data?.message || "Please try again."));
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
                      Upload Your Python Project
                    </h1>
                    
                    <p className="text-gray-600 text-center">
                      Upload an entire folder of Python files to be analyzed together as a project.
                    </p>
                    
                    <div className="w-full">
                      <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 mb-2">
                        Project Name
                      </label>
                      <input
                        type="text"
                        id="projectName"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                        placeholder="Enter project name"
                        required
                      />
                    </div>
                    
                    <div className="w-full border-2 border-dashed border-sky-300 rounded-lg p-6 text-center hover:border-sky-500 transition-colors duration-200">
                      <input
                        ref={folderInputRef}
                        type="file"
                        id="folder"
                        name="folder"
                        accept=".py"
                        webkitdirectory="true"
                        directory="true"
                        multiple
                        onChange={handleFolderSelect}
                        className="hidden"
                      />
                      
                      <div 
                        onClick={() => folderInputRef.current.click()}
                        className="cursor-pointer"
                      >
                        <div className="mb-4 flex justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11v6m-3-3h6" />
                          </svg>
                        </div>
                        <p className="font-medium text-sky-700">
                          Click to select a project folder
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          All .py files will be processed
                        </p>
                      </div>
                      
                      {fileCount.total > 0 && (
                        <div className="mt-4 p-3 bg-sky-50 rounded-lg text-left">
                          <p className="text-sm text-sky-800">
                            <span className="font-medium">Selected folder:</span> {folderInputRef.current?.files[0]?.webkitRelativePath.split('/')[0]}
                          </p>
                          <p className="text-sm text-sky-800">
                            <span className="font-medium">Files found:</span> {fileCount.total} total, {fileCount.python} Python files
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <button
                      type="submit"
                      disabled={isUploading || fileCount.python === 0 || !projectName.trim()}
                      className={`bg-yellow-400 text-sky-700 px-5 py-3 rounded-lg font-medium w-full
                                transform hover:scale-105 transition duration-300 ease-in-out hover:bg-yellow-500 
                                hover:shadow-lg ${(isUploading || fileCount.python === 0 || !projectName.trim()) ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      Continue
                    </button>
                    
                    {uploadError && (
                      <p className="text-red-500 text-center">{uploadError}</p>
                    )}
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
        
      case 2: // File Selection View
        return (
          <div className="container mx-auto px-6 py-10 max-w-4xl">
            <h1 className="text-3xl font-bold text-sky-700 mb-6">Select Python Files to Process</h1>
            
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-sky-700 mb-2">Project: {projectName}</h2>
                <p className="text-gray-600">
                  Select which files to include in your documentation. Python files are selected by default.
                </p>
              </div>
              
              <div className="border rounded-lg overflow-hidden mb-6">
                <div className="bg-gray-50 px-4 py-3 border-b">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium text-gray-700">Files</h3>
                    <span className="text-sm text-gray-500">{selectedFiles.filter(f => f.selected).length} of {selectedFiles.length} selected</span>
                  </div>
                </div>
                
                <div className="max-h-96 overflow-y-auto">
                  <ul className="divide-y divide-gray-200">
                    {selectedFiles.map((file, index) => (
                      <li key={index} className="px-4 py-3 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={file.selected}
                              onChange={() => toggleFileSelection(file.path)}
                              className="h-4 w-4 text-sky-600 focus:ring-sky-500 border-gray-300 rounded"
                            />
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-3 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="ml-2 text-gray-700">{file.path}</span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {(file.size / 1024).toFixed(1)} KB
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <div className="flex justify-between">
                <button
                  onClick={() => setProcessingStep(1)}
                  className="px-4 py-2 text-sky-700 border border-sky-300 rounded hover:bg-sky-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleFolderUpload}
                  disabled={selectedFiles.filter(f => f.selected).length === 0}
                  className={`bg-yellow-400 text-sky-700 px-5 py-2 rounded-lg font-medium
                           hover:bg-yellow-500 transition-colors ${
                             selectedFiles.filter(f => f.selected).length === 0 ? 'opacity-50 cursor-not-allowed' : ''
                           }`}
                >
                  Process Selected Files
                </button>
              </div>
            </div>
          </div>
        );
        
      case 3: // Processing
        return (
          <div className="container mx-auto px-6 py-20 max-w-2xl text-center">
            <h1 className="text-3xl font-bold text-sky-700 mb-10">Processing Your Project</h1>
            
            <div className="bg-white rounded-lg shadow-lg p-10">
              <div className="animate-pulse flex flex-col items-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
              
              <p className="text-xl font-medium text-gray-700 mb-6">
                Generating documentation for <span className="font-bold text-sky-700">{projectName}</span>
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
                This may take a minute or two depending on the size of your project...
              </p>
            </div>
          </div>
        );
        
      case 4: // Complete
        return (
          <div className="container mx-auto px-6 py-20 max-w-2xl text-center">
            <h1 className="text-3xl font-bold text-sky-700 mb-10">Documentation Generated!</h1>
            
            <div className="bg-white rounded-lg shadow-lg p-10">
              <div className="flex justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <p className="text-xl font-medium text-gray-700 mb-6">
                We've successfully created documentation for <span className="font-bold text-sky-700">{projectName}</span>
              </p>
              
              <p className="text-gray-600 mb-8">
                {selectedFiles.filter(f => f.selected).length} files were processed and documented.
              </p>
              
              <div className="flex flex-col md:flex-row justify-center space-y-4 md:space-y-0 md:space-x-4">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="bg-sky-600 text-white px-5 py-3 rounded-lg font-medium hover:bg-sky-700 transition-colors"
                >
                  View Documentation
                </button>
                <button
                  onClick={() => {
                    setProcessingStep(1);
                    setFileCount({ total: 0, python: 0 });
                    setSelectedFiles([]);
                    folderInputRef.current.value = null;
                    setProjectName("");
                  }}
                  className="bg-white text-sky-700 border border-sky-300 px-5 py-3 rounded-lg font-medium hover:bg-sky-50 transition-colors"
                >
                  Upload Another Project
                </button>
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return renderStepContent();
};

export default FolderUpload;