import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectsAPI } from '../../../shared/services/api';

const ExclusionSettings = () => {
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Exclusion settings
  const [skipItems, setSkipItems] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [fileExclusions, setFileExclusions] = useState([]);
  const [fileInputValue, setFileInputValue] = useState('');
  const [directoryExclusions, setDirectoryExclusions] = useState([]);
  const [directoryInputValue, setDirectoryInputValue] = useState('');
  
  // Common exclusions
  const [commonExclusions, setCommonExclusions] = useState({
    __pycache__: true,
    test_files: true,
    __init__: false,
    private_methods: true,
    import_statements: true
  });

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await projectsAPI.getProjectById(projectId);
        setProject(response.data);
        
        // Load existing exclusions if any
        if (response.data.exclusions) {
          setSkipItems(response.data.exclusions.functions || []);
          setFileExclusions(response.data.exclusions.files || []);
          setDirectoryExclusions(response.data.exclusions.directories || []);
          setCommonExclusions({
            ...commonExclusions,
            ...response.data.exclusions.common
          });
        }
      } catch (error) {
        console.error('Error fetching project:', error);
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchProject();
    }
  }, [projectId, navigate]);

  // Function/Class exclusions
  const handleAddItem = (e) => {
    e.preventDefault();
    if (inputValue.trim() && !skipItems.includes(inputValue.trim())) {
      setSkipItems([...skipItems, inputValue.trim()]);
      setInputValue('');
    }
  };

  const handleRemoveItem = (item) => {
    setSkipItems(skipItems.filter((skipItem) => skipItem !== item));
  };

  // File exclusions
  const handleAddFileExclusion = (e) => {
    e.preventDefault();
    if (fileInputValue.trim() && !fileExclusions.includes(fileInputValue.trim())) {
      setFileExclusions([...fileExclusions, fileInputValue.trim()]);
      setFileInputValue('');
    }
  };

  const handleRemoveFileExclusion = (item) => {
    setFileExclusions(fileExclusions.filter((file) => file !== item));
  };

  // Directory exclusions
  const handleAddDirectoryExclusion = (e) => {
    e.preventDefault();
    if (directoryInputValue.trim() && !directoryExclusions.includes(directoryInputValue.trim())) {
      setDirectoryExclusions([...directoryExclusions, directoryInputValue.trim()]);
      setDirectoryInputValue('');
    }
  };

  const handleRemoveDirectoryExclusion = (item) => {
    setDirectoryExclusions(directoryExclusions.filter((dir) => dir !== item));
  };

  // Common exclusions toggle
  const handleCommonExclusionToggle = (key) => {
    setCommonExclusions({
      ...commonExclusions,
      [key]: !commonExclusions[key]
    });
  };

  // Save exclusions
  const handleSaveExclusions = async () => {
    setSaving(true);
    
    try {
      const exclusionData = {
        functions: skipItems,
        files: fileExclusions,
        directories: directoryExclusions,
        common: commonExclusions
      };
      
      await projectsAPI.updateProjectExclusions(projectId, exclusionData);
      
      // Navigate to documentation generation
      navigate(`/project/${projectId}/generate`);
    } catch (error) {
      console.error('Error saving exclusions:', error);
    } finally {
      setSaving(false);
    }
  };

  // Skip exclusions and go directly to generation
  const handleSkipExclusions = () => {
    navigate(`/project/${projectId}/generate`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-sky-700 mb-2">Set Exclusions</h1>
        <p className="text-gray-600">
          Configure what to skip during documentation generation for <span className="font-medium text-sky-700">{project?.name}</span>
        </p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="ml-2 text-sm font-medium text-green-600">Files Uploaded</span>
          </div>
          
          <div className="flex-1 h-px bg-gray-300 mx-4"></div>
          
          <div className="flex items-center">
            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
              <span className="text-yellow-600 text-sm font-medium">3</span>
            </div>
            <span className="ml-2 text-sm font-medium text-yellow-600">Set Exclusions</span>
          </div>
          
          <div className="flex-1 h-px bg-gray-300 mx-4"></div>
          
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
              <span className="text-gray-400 text-sm">4</span>
            </div>
            <span className="ml-2 text-sm font-medium text-gray-400">Generate Docs</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Common Exclusions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Common Exclusions</h2>
          <p className="text-gray-600 mb-4">Quick toggles for common items to exclude</p>
          
          <div className="space-y-3">
            {Object.entries(commonExclusions).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-gray-700">
                    {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                  <p className="text-sm text-gray-500">
                    {key === '__pycache__' && 'Skip __pycache__ directories'}
                    {key === 'test_files' && 'Skip test files (test_*.py)'}
                    {key === '__init__' && 'Skip __init__.py files'}
                    {key === 'private_methods' && 'Skip private methods (_method)'}
                    {key === 'import_statements' && 'Skip import statements'}
                  </p>
                </div>
                <button
                  onClick={() => handleCommonExclusionToggle(key)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    value ? 'bg-sky-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      value ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Function/Class Exclusions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Function/Class Exclusions</h2>
          <p className="text-gray-600 mb-4">Specific functions or classes to skip</p>
          
          <form onSubmit={handleAddItem} className="mb-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="function_name or ClassName"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <button
                type="submit"
                className="bg-sky-600 text-white px-4 py-2 rounded-md hover:bg-sky-700 transition-colors"
              >
                Add
              </button>
            </div>
          </form>
          
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {skipItems.map((item, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                <span className="text-sm font-mono">{item}</span>
                <button
                  onClick={() => handleRemoveItem(item)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* File Exclusions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">File Exclusions</h2>
          <p className="text-gray-600 mb-4">Specific files to exclude from documentation</p>
          
          <form onSubmit={handleAddFileExclusion} className="mb-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={fileInputValue}
                onChange={(e) => setFileInputValue(e.target.value)}
                placeholder="filename.py or *.py"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <button
                type="submit"
                className="bg-sky-600 text-white px-4 py-2 rounded-md hover:bg-sky-700 transition-colors"
              >
                Add
              </button>
            </div>
          </form>
          
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {fileExclusions.map((item, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                <span className="text-sm font-mono">{item}</span>
                <button
                  onClick={() => handleRemoveFileExclusion(item)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Directory Exclusions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Directory Exclusions</h2>
          <p className="text-gray-600 mb-4">Directories to exclude completely</p>
          
          <form onSubmit={handleAddDirectoryExclusion} className="mb-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={directoryInputValue}
                onChange={(e) => setDirectoryInputValue(e.target.value)}
                placeholder="tests/ or build/"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <button
                type="submit"
                className="bg-sky-600 text-white px-4 py-2 rounded-md hover:bg-sky-700 transition-colors"
              >
                Add
              </button>
            </div>
          </form>
          
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {directoryExclusions.map((item, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                <span className="text-sm font-mono">{item}</span>
                <button
                  onClick={() => handleRemoveDirectoryExclusion(item)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex justify-between">
        <button
          onClick={() => navigate(`/project/${projectId}`)}
          className="bg-gray-100 text-gray-700 px-6 py-3 rounded-md hover:bg-gray-200 transition-colors"
        >
          Back to Project
        </button>
        
        <div className="flex space-x-4">
          <button
            onClick={handleSkipExclusions}
            className="bg-gray-500 text-white px-6 py-3 rounded-md hover:bg-gray-600 transition-colors"
          >
            Skip Exclusions
          </button>
          
          <button
            onClick={handleSaveExclusions}
            disabled={saving}
            className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center"
          >
            {saving && (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {saving ? 'Saving...' : 'Save & Generate Documentation'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExclusionSettings;