import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { projectsAPI } from '../../../shared/services/api';
import { notifyLoading, updateToast } from '../../../shared/utils/toast';
import { handleApiError } from '../../../shared/utils/errorHandler';
import { toast } from 'react-toastify';

const Dashboard = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchProjects = async () => {
      const toastId = notifyLoading('Loading your projects...');
      
      try {
        setLoading(true);
        const response = await projectsAPI.getAllProjects();
        setProjects(response.data);
        
        // Only show success message if there are projects
        if (response.data.length > 0) {
          updateToast(toastId, 'success', `Loaded ${response.data.length} projects`);
        } else {
          // Just dismiss the toast without showing "Loaded 0 projects"
          toast.dismiss(toastId);
        }
      } catch (error) {
        handleApiError(error, {
          defaultMessage: 'Failed to load projects',
          showToast: false
        });
        updateToast(toastId, 'error', 'Failed to load projects');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProjects();
  }, []);

  // Filter and search projects
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || project.status === filter;
    return matchesSearch && matchesFilter;
  });

  const handleDeleteProject = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this project?')) {
      return;
    }
    
    const toastId = notifyLoading('Deleting project...');
    
    try {
      await projectsAPI.deleteProject(id);
      
      // Update projects list
      setProjects(projects.filter(project => project.id !== id));
      
      updateToast(toastId, 'success', 'Project deleted successfully');
    } catch (error) {
      handleApiError(error, {
        defaultMessage: 'Failed to delete project',
        showToast: false
      });
      updateToast(toastId, 'error', 'Failed to delete project');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-4 md:mb-0">Your Projects</h1>
        
        <Link 
          to="/upload-selection"
          className="bg-yellow-400 hover:bg-yellow-500 text-sky-800 font-semibold px-8 py-2.5 rounded-lg 
                    transition-all duration-300 transform hover:scale-105 hover:shadow-md flex items-center justify-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          Upload
        </Link>
      </div>
      
      {/* Dev mode notification */}
      {import.meta.env.DEV && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-md mb-6">
          <p className="font-medium">Development Mode</p>
          <p>Showing sample projects. Connect to backend for real data.</p>
        </div>
      )}
      
      {/* Search and filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-grow">
          <input
            type="text"
            placeholder="Search projects..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 absolute right-3 top-2.5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Projects</option>
          <option value="complete">Completed</option>
          <option value="processing">Processing</option>
          <option value="failed">Failed</option>
        </select>
      </div>
      
      {/* Projects list */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-md mb-4">
          {error}
        </div>
      ) : filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <Link 
              key={project.id} 
              to={`/project/${project.id}`}
              className="block border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow bg-white"
            >
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <h3 className="text-xl font-semibold text-gray-800">{project.name}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    project.status === 'complete' ? 'bg-green-100 text-green-800' : 
                    project.status === 'processing' ? 'bg-blue-100 text-blue-800' : 
                    'bg-red-100 text-red-800'
                  }`}>
                    {project.status === 'complete' ? 'Completed' : 
                     project.status === 'processing' ? 'Processing' : 'Failed'}
                  </span>
                </div>
                
                <div className="mt-4 flex items-center text-sm text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {project.dateCreated}
                </div>
                
                <div className="mt-2 flex items-center text-sm text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {project.fileCount} files
                </div>
                
                <div className="mt-6 flex justify-end">
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    View Details →
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          {/* Empty state with no content */}
        </div>
      )}
      
      {/* Empty state when no projects exist */}
      {!loading && projects.length === 0 && (
        <div className="text-center py-16 bg-gray-50 rounded-lg">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h2 className="mt-4 text-xl font-semibold text-gray-800">No projects yet</h2>
          <p className="mt-2 text-gray-600 max-w-md mx-auto">
            Get started by uploading your first Python project to generate documentation.
          </p>
          <Link 
            to="/upload-selection"
            className="mt-6 inline-block bg-yellow-400 hover:bg-yellow-500 text-sky-800 font-bold px-8 py-3 rounded-lg 
                     transition-all transform hover:scale-105 hover:shadow-lg"
          >
            Upload Your First Project
          </Link>
        </div>
      )}
    </div>
  );
};

export default Dashboard;