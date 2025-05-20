import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { docsAPI, filesAPI } from '../../../shared/services/api';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs';

const FileDocumentation = () => {
  const { fileId } = useParams();
  const [file, setFile] = useState(null);
  const [documentation, setDocumentation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFileDocumentation = async () => {
      try {
        setLoading(true);
        
        if (import.meta.env.DEV) {
          // Mock data
          await new Promise(resolve => setTimeout(resolve, 800));
          
          const mockFile = {
            id: fileId,
            name: 'main.py',
            path: '/main.py',
            size: '2.4 KB',
            projectId: 'dev-project-1',
            documentationStatus: 'complete'
          };
          
          const mockDocumentation = {
            content: `"""
Main module for data processing application.

This module provides the entry point for the data processing workflow.
It handles command line arguments and orchestrates the process.
"""

def main(args=None):
    """Entry point function that orchestrates the workflow.
    
    Args:
        args (list, optional): Command line arguments. Defaults to None.
        
    Returns:
        int: Exit code
    """
    if args is None:
        args = sys.argv[1:]
        
    # Parse arguments
    parsed_args = parse_arguments(args)
    
    # Initialize processing
    processor = DataProcessor(parsed_args.input_file)
    
    # Process data
    results = processor.process()
    
    # Save results
    save_results(results, parsed_args.output_file)
    
    return 0`,
            functions: [
              {
                name: 'main',
                signature: 'main(args=None)',
                description: 'Entry point function that orchestrates the workflow.',
                params: [{ name: 'args', type: 'list', description: 'Command line arguments. Defaults to None.' }],
                returns: { type: 'int', description: 'Exit code' }
              },
              {
                name: 'parse_arguments',
                signature: 'parse_arguments(args)',
                description: 'Parse command line arguments',
                params: [{ name: 'args', type: 'list', description: 'Command line arguments' }],
                returns: { type: 'argparse.Namespace', description: 'Parsed arguments' }
              }
            ]
          };
          
          setFile(mockFile);
          setDocumentation(mockDocumentation);
        } else {
          // Real API calls
          const fileResponse = await filesAPI.getFileById(fileId);
          setFile(fileResponse.data);
          
          const docResponse = await docsAPI.getFileDocumentation(fileId);
          setDocumentation(docResponse.data);
        }
      } catch (err) {
        console.error('Error fetching file documentation:', err);
        handleApiError(error, {
          defaultMessage: 'Failed to load file documentation',
          showToast: true
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchFileDocumentation();
  }, [fileId]);

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
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-md mb-6">
          <p className="font-medium">Development Mode</p>
          <p>Showing sample documentation. Connect to backend for real data.</p>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-md mb-4">
          {error}
        </div>
      )}
      
      {file && documentation && (
        <>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-1">{file.name}</h1>
              <p className="text-gray-500">{file.path}</p>
            </div>
            
            <div className="flex space-x-3">
              {/* Here's the Edit button we discussed */}
              <Link 
                to={`/file/${fileId}/edit`}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Documentation
              </Link>
              
              <Link
                to={`/project/${file.projectId}`}
                className="border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-md text-gray-700"
              >
                Back to Project
              </Link>
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Documentation</h2>
            
            <div className="bg-gray-50 p-4 rounded overflow-auto">
              <SyntaxHighlighter language="python" style={docco} showLineNumbers>
                {documentation.content}
              </SyntaxHighlighter>
            </div>
            
            {documentation.functions && documentation.functions.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">Functions</h3>
                
                <div className="space-y-6">
                  {documentation.functions.map((func, index) => (
                    <div key={index} className="border-t border-gray-200 pt-4">
                      <h4 className="font-bold text-blue-700">{func.signature}</h4>
                      <p className="my-2">{func.description}</p>
                      
                      {func.params && func.params.length > 0 && (
                        <div className="mt-3">
                          <h5 className="font-medium">Parameters:</h5>
                          <ul className="list-disc pl-5 mt-1">
                            {func.params.map((param, i) => (
                              <li key={i} className="mt-1">
                                <code className="bg-gray-100 px-1 rounded">{param.name}</code> 
                                <span className="text-gray-500 italic ml-1">({param.type})</span>: {param.description}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {func.returns && (
                        <div className="mt-3">
                          <h5 className="font-medium">Returns:</h5>
                          <p className="mt-1">
                            <span className="text-gray-500 italic">({func.returns.type})</span>: {func.returns.description}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
      
      {!file && !loading && (
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-md mb-4">
            File not found
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

export default FileDocumentation;