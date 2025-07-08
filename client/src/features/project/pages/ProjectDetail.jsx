import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { projectsAPI, filesAPI } from '../../../shared/services/api';
import { toast } from 'react-toastify';
import { notifySuccess, notifyError, notifyInfo, notifyLoading, updateToast } from '../../../shared/utils/toast';
import { handleApiError } from '../../../shared/utils/errorHandler';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    const fetchProjectData = async () => {
      const toastId = notifyLoading('Loading project details...');
      
      try {
        setLoading(true);
        
        // Fetch project details
        const projectResponse = await projectsAPI.getProjectById(id);
        setProject(projectResponse.data);
        
        // Fetch project files
        const filesResponse = await filesAPI.getFilesByProjectId(id);
        setFiles(filesResponse.data || []);
        
        updateToast(toastId, 'success', 'Project loaded successfully');
      } catch (error) {
        handleApiError(error, {
          defaultMessage: 'Failed to load project details',
          showToast: false
        });
        updateToast(toastId, 'error', 'Failed to load project details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProjectData();
  }, [id]);

  const handleExport = async (format) => {
    try {
      setExportMenuOpen(false);
      
      // Show loading notification
      toast.info(`Preparing ${format.toUpperCase()} export...`);
      
      if (import.meta.env.DEV) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // In development mode, just show a success message
        toast.success(`Export successful! ${format.toUpperCase()} documentation would download in production.`);
      } else {
        // In production, make actual API call and download the file
        const response = await docsAPI.exportDocumentation(id, format);
        
        // Create a download link
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${project.name}_documentation.${format}`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        
        toast.success(`Documentation exported successfully as ${format.toUpperCase()}`);
      }
    } catch (err) {
      console.error(`Failed to export as ${format}:`, err);
      toast.error(`Failed to export documentation. Please try again.`);
    }
  };

  const handleRegenerateDocumentation = async () => {
    try {
      setRegenerating(true);
      
      // Create loading toast
      const toastId = notifyLoading('Regenerating documentation. This may take a moment...');
      
      if (import.meta.env.DEV) {
        // Simulate API delay in development
        await new Promise(resolve => setTimeout(resolve, 2000));
        updateToast(toastId, 'success', 'Documentation regenerated successfully!');
      } else {
        // Make API call to regenerate documentation
        await docsAPI.generateDocumentation(id);
        updateToast(toastId, 'success', 'Documentation regenerated successfully!');
        
        // Refresh project data
        const updatedProject = await projectsAPI.getProjectById(id);
        setProject(updatedProject.data);
        
        // Refresh files data
        const updatedFiles = await filesAPI.getFilesByProjectId(id);
        setFiles(updatedFiles.data || []);
      }
    } catch (error) {
      handleApiError(error, {
        defaultMessage: 'Failed to regenerate documentation. Please try again.',
        showToast: true
      });
    } finally {
      setRegenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-8 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      {/* Dev mode notification */}
      {import.meta.env.DEV && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-md mb-6">
          <p className="font-medium">Development Mode</p>
          <p>Showing sample project details. Connect to backend for real data.</p>
        </div>
      )}
      
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-md mb-6">
          {error}
        </div>
      )}
      
      {project && (
        <>
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{project.name}</h1>
              <p className="text-gray-500">
                Created: {project.dateCreated}
              </p>
            </div>
            
            <div className="mt-4 md:mt-0">
              <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${
                project.status === 'complete' ? 'bg-green-100 text-green-800' : 
                project.status === 'processing' ? 'bg-blue-100 text-blue-800' : 
                'bg-red-100 text-red-800'
              }`}>
                {project.status === 'complete' ? 'Completed' : 
                 project.status === 'processing' ? 'Processing' : 'Failed'}
              </span>
            </div>
          </div>
          
          <div className="bg-gray-50 p-6 rounded-lg mb-8">
            <h2 className="text-xl font-semibold mb-2">Description</h2>
            <p className="text-gray-700">
              {project.description}
            </p>
          </div>
          
          {/* PROJECT PROGRESS STEPS */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Project Progress</h2>
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between">
                {/* Step 1: Project Created */}
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="ml-2 text-sm font-medium text-green-600">Project Created</span>
                </div>
                
                <div className="flex-1 h-px bg-gray-300 mx-4"></div>
                
                {/* Step 2: Upload Files */}
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    files.length > 0 ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    {files.length > 0 ? (
                      <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <span className="text-gray-400 text-sm">2</span>
                    )}
                  </div>
                  <span className={`ml-2 text-sm font-medium ${
                    files.length > 0 ? 'text-green-600' : 'text-gray-400'
                  }`}>
                    Upload Files
                  </span>
                </div>
                
                <div className="flex-1 h-px bg-gray-300 mx-4"></div>
                
                {/* Step 3: Set Exclusions */}
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    project?.exclusions_set ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    {project?.exclusions_set ? (
                      <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <span className="text-gray-400 text-sm">3</span>
                    )}
                  </div>
                  <span className={`ml-2 text-sm font-medium ${
                    project?.exclusions_set ? 'text-green-600' : 'text-gray-400'
                  }`}>
                    Set Exclusions
                  </span>
                </div>
                
                <div className="flex-1 h-px bg-gray-300 mx-4"></div>
                
                {/* Step 4: Generate Docs */}
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    project?.status === 'complete' ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    {project?.status === 'complete' ? (
                      <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <span className="text-gray-400 text-sm">4</span>
                    )}
                  </div>
                  <span className={`ml-2 text-sm font-medium ${
                    project?.status === 'complete' ? 'text-green-600' : 'text-gray-400'
                  }`}>
                    Generate Docs
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Project Files</h2>
            {files.length === 0 ? (
              <p className="text-gray-500">No files found in this project.</p>
            ) : (
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        File Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Size
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {files.map((file) => (
                      <tr key={file.id}>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{file.name}</div>
                          <div className="text-sm text-gray-500">{file.path}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {file.size}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {file.documentationStatus === 'complete' ? (
                            <div>
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                Complete
                              </span>
                              <div className="mt-1 w-24 bg-gray-200 rounded-full h-2">
                                <div className="bg-green-600 h-2 rounded-full" style={{ width: `${file.documentationPercent}%` }}></div>
                              </div>
                            </div>
                          ) : file.documentationStatus === 'partial' ? (
                            <div>
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                Partial
                              </span>
                              <div className="mt-1 w-24 bg-gray-200 rounded-full h-2">
                                <div className="bg-yellow-600 h-2 rounded-full" style={{ width: `${file.documentationPercent}%` }}></div>
                              </div>
                            </div>
                          ) : file.documentationStatus === 'processing' ? (
                            <div>
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                Processing
                              </span>
                              <div className="mt-1 w-24 bg-gray-200 rounded-full h-2">
                                <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${file.documentationPercent}%` }}></div>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                {file.documentationStatus === 'failed' ? 'Failed' : 'Pending'}
                              </span>
                              <div className="mt-1 w-24 bg-gray-200 rounded-full h-2">
                                <div className="bg-gray-400 h-2 rounded-full" style={{ width: `${file.documentationPercent}%` }}></div>
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <Link 
                            to={`/file/${file.id}`}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            View Docs
                          </Link>
                          <Link 
                            to={`/file/${file.id}/edit`}
                            className="text-green-600 hover:text-green-900"
                          >
                            Edit
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          {/* NEXT STEPS NAVIGATION */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Next Steps</h2>
            <div className="flex space-x-4">
              {files.length === 0 ? (
                <Link
                  to={`/project/${id}/upload`}
                  className="bg-sky-600 hover:bg-sky-700 text-white px-6 py-3 rounded-md flex items-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Upload Files
                </Link>
              ) : !project?.exclusions_set ? (
                <Link
                  to={`/project/${id}/exclusions`}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-md flex items-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                  </svg>
                  Set Exclusions
                </Link>
              ) : project?.status !== 'complete' ? (
                <button
                  onClick={() => navigate(`/project/${id}/generate`)}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-md flex items-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Generate Documentation
                </button>
              ) : (
                <div className="text-green-600 font-medium">
                  ✅ Project Complete! Ready to export documentation.
                </div>
              )}
            </div>
          </div>
          
          <div className="flex space-x-4">
            <Link 
              to={`/project/${id}/documentation`}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
            >
              View Full Documentation
            </Link>
            <div className="dropdown relative">
              <button 
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md flex items-center"
                onClick={() => setExportMenuOpen(!exportMenuOpen)}
              >
                Export Documentation
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
              
              {exportMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
                  <div className="py-1">
                    <button 
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => handleExport('pdf')}
                    >
                      Export as PDF
                    </button>
                    <button 
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => handleExport('html')}
                    >
                      Export as HTML
                    </button>
                    <button 
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => handleExport('markdown')}
                    >
                      Export as Markdown
                    </button>
                  </div>
                </div>
              )}
            </div>
            <button 
              onClick={handleRegenerateDocumentation}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
              Regenerate Documentation
            </button>
            <Link 
              to="/dashboard"
              className="border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-md text-gray-700"
            >
              Back to Dashboard
            </Link>
          </div>
        </>
      )}
      
      {!project && !loading && (
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-md mb-4">
            Project not found
          </div>
          <Link 
            to="/dashboard" 
            className="mt-4 inline-block bg-blue-500 text-white px-4 py-2 rounded-md"
          >
            Back to Dashboard
          </Link>
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;