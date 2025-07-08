import React from 'react';
import { Link } from 'react-router-dom';

const TestRoutes = () => {
  const routes = [
    // Public pages
    { path: '/', name: 'Home Page' },
    { path: '/about', name: 'About Page' },
    { path: '/login', name: 'Login Page' },
    { path: '/register', name: 'Register Page' },
    
    // Dashboard & Projects
    { path: '/dashboard', name: 'Dashboard' },
    { path: '/upload-selection', name: 'Upload Selection' },
    
    // File Upload Pages
    { path: '/file-upload', name: 'File Upload' },
    { path: '/folder-upload', name: 'Folder Upload' },
    { path: '/repo-upload', name: 'Repo Upload' },
    
    // Project Pages (with test IDs)
    { path: '/project/test-123', name: 'Project Detail (Test)' },
    { path: '/project/test-123/exclusions', name: 'Exclusion Settings (Test)' },
    { path: '/project/test-123/generate', name: 'Generate Documentation (Test)' },
    { path: '/project/test-123/documentation', name: 'Documentation Viewer (Test)' },
    
    // File Documentation (with test IDs)
    { path: '/file/test-file-456', name: 'File Documentation (Test)' },
    { path: '/file/test-file-456/edit', name: 'Edit Documentation (Test)' },
    
    // Auth & Test
    { path: '/auth-test', name: 'Auth Test' },
    { path: '/auth/github/callback', name: 'GitHub Callback' },
  ];

  return (
    <div className="container mx-auto px-6 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-sky-700 mb-8">🧪 Test Routes - All Pages</h1>
      
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
        <p className="text-yellow-800">
          <strong>Testing Mode:</strong> Click any link below to test individual pages without going through the full flow.
          Some pages use test IDs (test-123, test-file-456) for demonstration.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {routes.map((route, index) => (
          <Link 
            key={index} 
            to={route.path}
            className="block p-4 bg-white border border-gray-200 rounded-lg hover:border-sky-300 hover:shadow-md transition-all"
          >
            <div className="font-medium text-sky-700 mb-1">{route.name}</div>
            <div className="text-sm text-gray-500">{route.path}</div>
          </Link>
        ))}
      </div>

      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h2 className="font-semibold text-gray-700 mb-2">Quick Navigation:</h2>
        <div className="flex flex-wrap gap-2">
          <Link to="/dashboard" className="bg-sky-600 text-white px-3 py-1 rounded text-sm hover:bg-sky-700">
            Dashboard
          </Link>
          <Link to="/project/test-123" className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700">
            Test Project
          </Link>
          <Link to="/file-upload" className="bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700">
            File Upload
          </Link>
          <Link to="/project/test-123/documentation" className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700">
            Documentation
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TestRoutes;