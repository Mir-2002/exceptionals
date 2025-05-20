import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { filesAPI, projectsAPI } from '../../../shared/services/api';
import { notifyWarning, notifyLoading, updateToast } from '../../../shared/utils/toast';
import { handleApiError } from '../../../shared/utils/errorHandler';
import { useAuth } from '../../../shared/contexts/AuthContext';

const FileUpload = () => {
  const [file, setFile] = useState(null);
  const [projectName, setProjectName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      
      // Extract filename (without extension) for project name suggestion
      const fileName = e.target.files[0].name;
      const suggestedName = fileName.split('.').slice(0, -1).join('.') || fileName;
      
      // Only set project name if it's empty
      if (!projectName) {
        setProjectName(suggestedName);
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      
      // Extract filename for project name suggestion
      const fileName = e.dataTransfer.files[0].name;
      const suggestedName = fileName.split('.').slice(0, -1).join('.') || fileName;
      
      // Only set project name if it's empty
      if (!projectName) {
        setProjectName(suggestedName);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      notifyWarning('Please select a file to upload');
      return;
    }
    
    if (!projectName.trim()) {
      notifyWarning('Please enter a project name');
      return;
    }

    const toastId = notifyLoading('Creating project...');
    
    try {
      setUploading(true);
      
      // Create project
      const projectResponse = await projectsAPI.createProject({
        name: projectName,
        description: `Uploaded file: ${file.name}`,
        type: 'file'
      });
      
      const projectId = projectResponse.data.id;
      
      updateToast(toastId, 'info', 'Project created. Uploading file...');
      
      // Upload file with progress callback
      await filesAPI.uploadFile(
        projectId, 
        file, 
        (progress) => {
          setUploadProgress(progress);
        }
      );
      
      updateToast(toastId, 'success', 'File uploaded successfully!');
      
      // Navigate to project page
      setTimeout(() => {
        navigate(`/project/${projectId}`);
      }, 1000);
      
    } catch (error) {
      handleApiError(error, {
        defaultMessage: 'Failed to upload file. Please try again.',
        showToast: false
      });
      updateToast(toastId, 'error', 
        error.response?.data?.message || 'Failed to upload file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-center mb-8">Upload File</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
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
        
        {/* File drop zone */}
        <div 
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
            ${file ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-blue-400'}`}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            onChange={handleFileChange}
            className="hidden"
            ref={fileInputRef}
          />
          
          {file ? (
            <div>
              <p className="text-green-600 font-medium">File selected:</p>
              <p className="mt-1 text-gray-700">{file.name}</p>
              <p className="text-sm text-gray-500 mt-1">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
              <button 
                type="button"
                className="mt-4 px-4 py-2 bg-gray-200 rounded-md text-sm hover:bg-gray-300"
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
              >
                Remove
              </button>
            </div>
          ) : (
            <div>
              <svg 
                className="mx-auto h-12 w-12 text-gray-400" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor" 
                aria-hidden="true"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
                />
              </svg>
              <p className="mt-2 text-sm text-gray-600">
                Click to select or drag and drop a file here
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Python files, JavaScript files, etc.
              </p>
            </div>
          )}
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
        
        {/* Upload progress */}
        {uploading && (
          <div className="mb-4">
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium text-blue-700">Uploading...</span>
              <span className="text-sm font-medium text-blue-700">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}
        
        {/* Submit button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={uploading}
            className={`px-6 py-2 rounded-md text-white ${
              uploading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {uploading ? 'Uploading...' : 'Upload File'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FileUpload;