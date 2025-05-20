import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadFolderWithProgress } from '../../../shared/services/api';
import { useAuth } from '../../../shared/contexts/AuthContext';

const FolderUpload = () => {
  const [files, setFiles] = useState([]);
  const [projectName, setProjectName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const folderInputRef = useRef(null);
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const handleFolderChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const fileList = Array.from(e.target.files);
      setFiles(fileList);
      
      // Extract folder name for project name suggestion
      const folderPath = e.target.files[0].webkitRelativePath;
      if (folderPath) {
        const folderName = folderPath.split('/')[0];
        if (folderName && !projectName) {
          setProjectName(folderName);
        }
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!files.length) {
      setError('Please select a folder to upload');
      return;
    }
    
    if (!projectName.trim()) {
      setError('Please enter a project name');
      return;
    }
    
    try {
      setUploading(true);
      setError('');
      setSuccess('');
      setUploadProgress(0);
      
      // Start upload with progress tracking
      const result = await uploadFolderWithProgress(
        files, 
        projectName, 
        [], // skip items
        (progress) => setUploadProgress(progress)
      );
      
      setSuccess(`Folder uploaded successfully! Project ID: ${result.id}`);
      
      // Reset form
      setFiles([]);
      setProjectName('');
      if (folderInputRef.current) {
        folderInputRef.current.value = '';
      }
      
      // Navigate to the new project after a short delay
      setTimeout(() => {
        navigate(`/project/${result.id}`);
      }, 2000);
      
    } catch (error) {
      console.error('Upload error:', error);
      setError(error.message || 'Failed to upload folder');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-center mb-8">Upload Folder</h1>
      
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
        
        {/* Folder selection */}
        <div className="border-2 border-dashed rounded-lg p-8 text-center">
          <input
            type="file"
            webkitdirectory="true"
            directory=""
            onChange={handleFolderChange}
            className="hidden"
            ref={folderInputRef}
          />
          
          {files.length > 0 ? (
            <div>
              <p className="text-green-600 font-medium">Folder selected:</p>
              <p className="mt-1 text-gray-700">
                {files[0].webkitRelativePath.split('/')[0]} ({files.length} files)
              </p>
              <div className="mt-2 text-sm text-gray-500">
                <div className="max-h-32 overflow-y-auto bg-gray-50 p-2 rounded text-left">
                  {files.slice(0, 5).map((file, index) => (
                    <div key={index} className="truncate">
                      {file.webkitRelativePath}
                    </div>
                  ))}
                  {files.length > 5 && (
                    <div className="text-gray-400 italic">
                      ...and {files.length - 5} more files
                    </div>
                  )}
                </div>
              </div>
              <button 
                type="button"
                className="mt-4 px-4 py-2 bg-gray-200 rounded-md text-sm hover:bg-gray-300"
                onClick={() => {
                  setFiles([]);
                  if (folderInputRef.current) folderInputRef.current.value = '';
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
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" 
                />
              </svg>
              <p className="mt-2 text-sm text-gray-600">
                Click to select a folder
              </p>
              <button 
                type="button"
                onClick={() => folderInputRef.current?.click()}
                className="mt-4 px-4 py-2 bg-gray-200 rounded-md text-sm hover:bg-gray-300"
              >
                Select Folder
              </button>
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
            {uploading ? 'Uploading...' : 'Upload Folder'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FolderUpload;