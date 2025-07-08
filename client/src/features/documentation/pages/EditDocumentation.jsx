import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { docsAPI, filesAPI } from '../../../shared/services/api';
import { notifyLoading, notifyWarning, updateToast } from '../../../shared/utils/toast';
import { handleApiError } from '../../../shared/utils/errorHandler';

const EditDocumentation = () => {
  const { fileId } = useParams();
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [documentation, setDocumentation] = useState('');
  const [originalDocumentation, setOriginalDocumentation] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDocumentation = async () => {
      const toastId = notifyLoading('Loading documentation...');
      
      try {
        setLoading(true);
        
        // Fetch file information
        const fileResponse = await filesAPI.getFileById(fileId);
        setFile(fileResponse.data);
        
        // Fetch documentation
        const docResponse = await docsAPI.getFileDocumentation(fileId);
        setDocumentation(docResponse.data.content);
        setOriginalDocumentation(docResponse.data.content);
        
        updateToast(toastId, 'success', 'Documentation loaded successfully');
      } catch (error) {
        setError('Failed to load documentation.');
        handleApiError(error, {
          defaultMessage: 'Failed to load documentation',
          showToast: false
        });
        updateToast(toastId, 'error', 'Failed to load documentation');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDocumentation();
  }, [fileId]);

  const handleSave = async () => {
    if (documentation.trim() === '') {
      notifyWarning('Documentation cannot be empty');
      return;
    }
    
    const toastId = notifyLoading('Saving changes...');
    
    try {
      setSaving(true);
      await docsAPI.updateDocumentation(fileId, { content: documentation });
      
      // Update the original documentation after saving
      setOriginalDocumentation(documentation);
      
      updateToast(toastId, 'success', 'Documentation saved successfully');
      
      // Navigate back to file view
      setTimeout(() => {
        navigate(`/file/${fileId}`);
      }, 1000);
    } catch (error) {
      handleApiError(error, {
        defaultMessage: 'Failed to save documentation',
        showToast: false
      });
      updateToast(toastId, 'error', 'Failed to save documentation');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Confirm if there are unsaved changes
    if (documentation !== originalDocumentation) {
      if (window.confirm('You have unsaved changes. Are you sure you want to cancel?')) {
        navigate(`/file/${fileId}`);
      }
    } else {
      navigate(`/file/${fileId}`);
    }
  };
  
  const handleRegenerate = async () => {
    try {
      setSaving(true);
      
      if (import.meta.env.DEV) {
        // Mock regeneration delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Create some variation to simulate regeneration
        const regeneratedDoc = `"""
Main module for data processing application.

This module serves as the primary entry point for processing workflow.
It handles command-line arguments and coordinates the overall process.
"""

def main(args=None):
    """Primary entry point that coordinates the data processing workflow.
    
    Args:
        args (list, optional): Command-line arguments passed to the program. 
                              If None, sys.argv[1:] will be used. Defaults to None.
        
    Returns:
        int: Exit code (0 for success, non-zero for errors).
        
    Example:
        >>> main(['--input', 'data.csv', '--output', 'results.csv'])
        0
    """
    if args is None:
        args = sys.argv[1:]
        
    # Parse command line arguments
    parsed_args = parse_arguments(args)
    
    # Set up data processor with input file
    processor = DataProcessor(parsed_args.input_file)
    
    # Execute processing pipeline
    results = processor.process()
    
    # Write results to specified output file
    save_results(results, parsed_args.output_file)
    
    return 0`;
        
        setDocumentation(regeneratedDoc);
        alert('Documentation regenerated successfully!');
      } else {
        // Real API call to regenerate documentation for a specific file
        await docsAPI.generateDocumentation(file.projectId, { fileId });
        
        // Fetch the newly generated documentation
        const docResponse = await docsAPI.getFileDocumentation(fileId);
        setDocumentation(docResponse.data.content);
        
        alert('Documentation regenerated successfully!');
      }
    } catch (err) {
      console.error('Error regenerating documentation:', err);
      alert('Failed to regenerate documentation.');
    } finally {
      setSaving(false);
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
    <div className="container mx-auto p-4 md:p-8">
      {/* Dev mode notification */}
      {import.meta.env.DEV && (
        <div class="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-md mb-6">
          <p class="font-medium">Development Mode</p>
          <p>Changes won't be saved to a real backend.</p>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-md mb-4">
          {error}
        </div>
      )}
      
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-1">Edit Documentation</h1>
          <p className="text-gray-500">{file?.name}</p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={handleRegenerate}
            disabled={saving}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
            Regenerate
          </button>
        </div>
      </div>
      
      <div className="mb-6">
        <textarea
          value={documentation}
          onChange={e => setDocumentation(e.target.value)}
          className="w-full h-96 font-mono p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          spellCheck="false"
        />
      </div>
      
      <div className="flex justify-end space-x-4">
        <button
          onClick={handleCancel}
          className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center"
        >
          {saving ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </button>
      </div>
    </div>
  );
};

export default EditDocumentation;