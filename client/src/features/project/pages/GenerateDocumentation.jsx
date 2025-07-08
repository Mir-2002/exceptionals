import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectsAPI, docsAPI } from '../../../shared/services/api';
import FormatSelector from '../../documentation/components/FormatPreview';

const GenerateDocumentation = () => {
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(1);
  const [progress, setProgress] = useState(0);
  const [selectedFormat, setSelectedFormat] = useState('html');
  const [generationComplete, setGenerationComplete] = useState(false);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await projectsAPI.getProjectById(projectId);
        setProject(response.data);
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

  const handleGenerateDocumentation = async () => {
    setGenerating(true);
    setGenerationStep(1);
    setProgress(0);

    try {
      // Step 1: Initialize generation
      setGenerationStep(1);
      setProgress(20);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 2: Process files
      setGenerationStep(2);
      setProgress(40);
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Step 3: Generate with HuggingFace
      setGenerationStep(3);
      setProgress(60);
      
      if (import.meta.env.DEV) {
        // Mock HuggingFace API call
        await new Promise(resolve => setTimeout(resolve, 3000));
      } else {
        // Real API call
        await docsAPI.generateDocumentation(projectId, {
          format: selectedFormat,
          exclusions: project.exclusions
        });
      }

      // Step 4: Finalize
      setGenerationStep(4);
      setProgress(80);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 5: Complete
      setGenerationStep(5);
      setProgress(100);
      setGenerationComplete(true);
      
    } catch (error) {
      console.error('Error generating documentation:', error);
      setGenerating(false);
      setGenerationStep(1);
      setProgress(0);
    }
  };

  const handleViewDocumentation = () => {
    navigate(`/project/${projectId}/documentation`);
  };

  const handleBackToProject = () => {
    navigate(`/project/${projectId}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
      </div>
    );
  }

  if (generating) {
    return (
      <div className="container mx-auto px-6 py-8 max-w-2xl">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-sky-700 mb-8">Generating Documentation</h1>
          
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="mb-6">
              <div className="flex justify-center mb-4">
                <svg className="animate-spin h-16 w-16 text-sky-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                {generationStep === 1 && "Initializing documentation generation..."}
                {generationStep === 2 && "Processing uploaded files..."}
                {generationStep === 3 && "Generating documentation with AI..."}
                {generationStep === 4 && "Finalizing documentation..."}
                {generationStep === 5 && "Documentation generation complete!"}
              </h2>
              
              <p className="text-gray-600 mb-6">
                {generationStep === 1 && "Setting up the documentation pipeline"}
                {generationStep === 2 && "Analyzing Python files and applying exclusions"}
                {generationStep === 3 && "Using HuggingFace transformer to generate documentation"}
                {generationStep === 4 && "Creating final documentation structure"}
                {generationStep === 5 && "Your documentation is ready to view!"}
              </p>
            </div>
            
            <div className="mb-6">
              <div className="h-2 w-full bg-gray-200 rounded-full">
                <div 
                  className="h-2 bg-sky-500 rounded-full transition-all duration-500 ease-out" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-500 mt-2">{progress}% Complete</p>
            </div>
            
            {generationComplete && (
              <div className="mt-8 space-y-4">
                <div className="flex justify-center">
                  <svg className="w-16 h-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                
                <button
                  onClick={handleViewDocumentation}
                  className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                  View Documentation
                </button>
                
                <button
                  onClick={handleBackToProject}
                  className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Back to Project
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-sky-700 mb-2">Generate Documentation</h1>
        <p className="text-gray-600">
          Generate AI-powered documentation for <span className="font-medium text-sky-700">{project?.name}</span>
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
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="ml-2 text-sm font-medium text-green-600">Exclusions Set</span>
          </div>
          
          <div className="flex-1 h-px bg-gray-300 mx-4"></div>
          
          <div className="flex items-center">
            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
              <span className="text-yellow-600 text-sm font-medium">4</span>
            </div>
            <span className="ml-2 text-sm font-medium text-yellow-600">Generate Docs</span>
          </div>
        </div>
      </div>

      {/* Generation Options */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Documentation Options</h2>
        
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-700 mb-3">Select Output Format</h3>
          <FormatSelector 
            selectedFormat={selectedFormat} 
            onSelectFormat={setSelectedFormat}
          />
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-700 mb-3">Generation Summary</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Files to process:</span>
                <span className="ml-2 font-medium">{project?.files?.length || 0}</span>
              </div>
              <div>
                <span className="text-gray-600">Exclusions applied:</span>
                <span className="ml-2 font-medium">{project?.exclusions ? 'Yes' : 'No'}</span>
              </div>
              <div>
                <span className="text-gray-600">Output format:</span>
                <span className="ml-2 font-medium capitalize">{selectedFormat}</span>
              </div>
              <div>
                <span className="text-gray-600">AI Model:</span>
                <span className="ml-2 font-medium">HuggingFace Transformer</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between">
        <button
          onClick={() => navigate(`/project/${projectId}/exclusions`)}
          className="bg-gray-100 text-gray-700 px-6 py-3 rounded-md hover:bg-gray-200 transition-colors"
        >
          Back to Exclusions
        </button>
        
        <button
          onClick={handleGenerateDocumentation}
          className="bg-green-600 text-white px-8 py-3 rounded-md hover:bg-green-700 transition-colors flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Generate Documentation
        </button>
      </div>
    </div>
  );
};

export default GenerateDocumentation;