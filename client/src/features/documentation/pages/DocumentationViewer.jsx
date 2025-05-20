import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { projectsAPI, docsAPI } from '../../../shared/services/api';
import { notifyLoading, updateToast } from '../../../shared/utils/toast';
import { handleApiError } from '../../../shared/utils/errorHandler';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { docco } from 'react-syntax-highlighter/dist/cjs/styles/hljs';

const DocumentationViewer = () => {
  const { id: projectId } = useParams();
  const [project, setProject] = useState(null);
  const [documentation, setDocumentation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [viewMode, setViewMode] = useState('html'); // 'html' or 'markdown'
  const [exportFormat, setExportFormat] = useState('markdown');

  useEffect(() => {
    const fetchDocumentation = async () => {
      const toastId = notifyLoading('Loading project documentation...');
      
      try {
        setLoading(true);
        
        // For development - mock documentation
        if (import.meta.env.DEV) {
          await new Promise(resolve => setTimeout(resolve, 800));
          
          // Mock project data
          const mockProject = {
            id: projectId,
            name: projectId === 'dev-project-1' ? 'Example Python Project' :
                  projectId === 'dev-project-2' ? 'Data Analysis Tool' :
                  projectId === 'dev-project-3' ? 'Web Scraper' : 
                  projectId === 'dev-project-4' ? 'Failed Test Project' : 'Example Project',
            status: projectId === 'dev-project-4' ? 'failed' :
                    projectId === 'dev-project-2' ? 'processing' : 'complete',
          };
          
          // Generate mock documentation tree
          const mockDocs = {
            title: mockProject.name,
            summary: "This project contains several Python modules for data processing and analysis.",
            modules: [
              {
                name: "main.py",
                path: "/main.py",
                description: "Main entry point for the application",
                functions: [
                  {
                    name: "main()",
                    signature: "main(args=None)",
                    description: "Entry point function that orchestrates the workflow",
                    params: [{ name: "args", type: "list", description: "Command line arguments" }],
                    returns: { type: "int", description: "Exit code" },
                    examples: ["result = main(['--debug', '--input', 'data.csv'])"],
                    code: `def main(args=None):
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
    
    return 0`
                  },
                  {
                    name: "parse_arguments()",
                    signature: "parse_arguments(args)",
                    description: "Parse command line arguments",
                    params: [{ name: "args", type: "list", description: "Command line arguments" }],
                    returns: { type: "argparse.Namespace", description: "Parsed arguments" },
                    code: `def parse_arguments(args):
    """Parse command line arguments.
    
    Args:
        args (list): Command line arguments
        
    Returns:
        argparse.Namespace: Parsed arguments
    """
    parser = argparse.ArgumentParser(description="Data processing application")
    parser.add_argument("--input", dest="input_file", required=True, help="Input file path")
    parser.add_argument("--output", dest="output_file", default="output.csv", help="Output file path")
    parser.add_argument("--debug", action="store_true", help="Enable debug logging")
    
    return parser.parse_args(args)`
                  }
                ],
                classes: []
              },
              {
                name: "processor.py",
                path: "/processor.py",
                description: "Data processing utilities",
                functions: [],
                classes: [
                  {
                    name: "DataProcessor",
                    description: "Handles all data processing operations",
                    methods: [
                      {
                        name: "__init__",
                        signature: "__init__(self, input_file)",
                        description: "Initialize the data processor",
                        params: [
                          { name: "self", type: "DataProcessor", description: "Instance reference" },
                          { name: "input_file", type: "str", description: "Path to input file" }
                        ],
                        code: `def __init__(self, input_file):
    """Initialize the data processor.
    
    Args:
        input_file (str): Path to input file
    """
    self.input_file = input_file
    self.data = None`
                      },
                      {
                        name: "process",
                        signature: "process(self)",
                        description: "Process the input data",
                        params: [
                          { name: "self", type: "DataProcessor", description: "Instance reference" }
                        ],
                        returns: { type: "dict", description: "Processed data results" },
                        code: `def process(self):
    """Process the input data.
    
    Returns:
        dict: Processed data results
    """
    # Read data
    self.data = self._read_data()
    
    # Transform data
    transformed_data = self._transform_data(self.data)
    
    # Analyze data
    results = self._analyze_data(transformed_data)
    
    return results`
                      }
                    ]
                  }
                ]
              }
            ]
          };
          
          setProject(mockProject);
          setDocumentation(mockDocs);
          setSelectedFile(mockDocs.modules[0]);
          setError(null);
          updateToast(toastId, 'success', 'Documentation loaded successfully');
        } else {
          // Real API calls
          const projectResponse = await projectsAPI.getProjectById(projectId);
          setProject(projectResponse.data);
          
          const docsResponse = await docsAPI.getDocumentation(projectId);
          setDocumentation(docsResponse.data);
          
          // Select the first module/file by default
          if (docsResponse.data?.modules?.length > 0) {
            setSelectedFile(docsResponse.data.modules[0]);
          }
          updateToast(toastId, 'success', 'Documentation loaded successfully');
        }
      } catch (error) {
        handleApiError(error, {
          defaultMessage: 'Failed to load documentation',
          showToast: false
        });
        updateToast(toastId, 'error', 'Failed to load documentation');
        handleApiError(error, {
          defaultMessage: 'Failed to load documentation',
          showToast: true
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchDocumentation();
  }, [projectId]);
  
  const handleFileSelect = (file) => {
    setSelectedFile(file);
  };

  const handleExport = async () => {
    const toastId = notifyLoading(`Exporting documentation as ${exportFormat}...`);
    
    try {
      const response = await docsAPI.exportDocumentation(projectId, exportFormat);
      
      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${project?.name || 'documentation'}.${exportFormat}`);
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      link.remove();
      
      updateToast(toastId, 'success', `Documentation exported as ${exportFormat}`);
    } catch (error) {
      handleApiError(error, {
        defaultMessage: 'Failed to export documentation',
        showToast: false
      });
      updateToast(toastId, 'error', 'Failed to export documentation');
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
      
      {project && documentation && (
        <>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-1">{project.name} Documentation</h1>
              <p className="text-gray-500">{documentation.summary}</p>
            </div>
            
            <div className="flex space-x-3">
              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="html">HTML View</option>
                <option value="markdown">Markdown View</option>
              </select>
              
              <Link 
                to={`/project/${projectId}`}
                className="border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-md text-gray-700"
              >
                Back to Project
              </Link>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row gap-6">
            {/* File navigation sidebar */}
            <div className="w-full md:w-64 bg-gray-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold mb-3">Files</h2>
              <div className="divide-y divide-gray-200">
                {documentation.modules.map((module) => (
                  <div key={module.path} className="py-2">
                    <button
                      onClick={() => handleFileSelect(module)}
                      className={`w-full text-left px-2 py-1 rounded text-sm ${
                        selectedFile?.path === module.path ? 'bg-blue-100 text-blue-800 font-medium' : 'hover:bg-gray-100'
                      }`}
                    >
                      {module.name}
                    </button>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Documentation content */}
            <div className="flex-1 bg-white border border-gray-200 rounded-lg p-6 overflow-hidden">
              {selectedFile ? (
                <>
                  <h2 className="text-2xl font-bold mb-2">{selectedFile.name}</h2>
                  <p className="text-gray-600 mb-6">{selectedFile.description}</p>
                  
                  {selectedFile.functions.length > 0 && (
                    <div className="mb-8">
                      <h3 className="text-xl font-semibold mb-4">Functions</h3>
                      <div className="space-y-8">
                        {selectedFile.functions.map((func, index) => (
                          <div key={index} className="border-b border-gray-200 pb-6">
                            <h4 className="font-bold mb-2 text-blue-700">{func.signature}</h4>
                            <p className="mb-4">{func.description}</p>
                            
                            {func.params && func.params.length > 0 && (
                              <div className="mb-3">
                                <h5 className="font-semibold mb-2">Parameters:</h5>
                                <ul className="list-disc pl-5 space-y-1">
                                  {func.params.map((param, i) => (
                                    <li key={i}>
                                      <code className="bg-gray-100 px-1 rounded">{param.name}</code> 
                                      <span className="text-gray-500 italic ml-1">({param.type})</span>: {param.description}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            {func.returns && (
                              <div className="mb-3">
                                <h5 className="font-semibold mb-2">Returns:</h5>
                                <p>
                                  <span className="text-gray-500 italic">({func.returns.type})</span>: {func.returns.description}
                                </p>
                              </div>
                            )}
                            
                            {func.examples && func.examples.length > 0 && (
                              <div className="mb-3">
                                <h5 className="font-semibold mb-2">Examples:</h5>
                                {func.examples.map((example, i) => (
                                  <pre key={i} className="bg-gray-50 p-2 rounded mb-1">{example}</pre>
                                ))}
                              </div>
                            )}
                            
                            {func.code && (
                              <div className="mt-4">
                                <h5 className="font-semibold mb-2">Source Code:</h5>
                                <SyntaxHighlighter language="python" style={docco} className="rounded">
                                  {func.code}
                                </SyntaxHighlighter>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {selectedFile.classes.length > 0 && (
                    <div>
                      <h3 className="text-xl font-semibold mb-4">Classes</h3>
                      <div className="space-y-8">
                        {selectedFile.classes.map((cls, index) => (
                          <div key={index} className="border-b border-gray-200 pb-6">
                            <h4 className="font-bold mb-2 text-purple-700">{cls.name}</h4>
                            <p className="mb-6">{cls.description}</p>
                            
                            {cls.methods && cls.methods.length > 0 && (
                              <div className="ml-4">
                                <h5 className="font-semibold mb-4">Methods:</h5>
                                <div className="space-y-6">
                                  {cls.methods.map((method, i) => (
                                    <div key={i} className="border-l-2 border-gray-200 pl-4 py-1">
                                      <h6 className="font-bold mb-2 text-blue-700">{method.signature}</h6>
                                      <p className="mb-4">{method.description}</p>
                                      
                                      {method.params && method.params.length > 0 && (
                                        <div className="mb-3">
                                          <h6 className="font-semibold mb-2">Parameters:</h6>
                                          <ul className="list-disc pl-5 space-y-1">
                                            {method.params.map((param, pi) => (
                                              <li key={pi}>
                                                <code className="bg-gray-100 px-1 rounded">{param.name}</code> 
                                                <span className="text-gray-500 italic ml-1">({param.type})</span>: {param.description}
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}
                                      
                                      {method.returns && (
                                        <div className="mb-3">
                                          <h6 className="font-semibold mb-2">Returns:</h6>
                                          <p>
                                            <span className="text-gray-500 italic">({method.returns.type})</span>: {method.returns.description}
                                          </p>
                                        </div>
                                      )}
                                      
                                      {method.code && (
                                        <div className="mt-4">
                                          <h6 className="font-semibold mb-2">Source Code:</h6>
                                          <SyntaxHighlighter language="python" style={docco} className="rounded">
                                            {method.code}
                                          </SyntaxHighlighter>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Select a file to view its documentation
                </div>
              )}
            </div>
          </div>
        </>
      )}
      
      {!documentation && !loading && !error && (
        <div className="text-center py-12">
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-md mb-4">
            No documentation available for this project
          </div>
          <Link 
            to={`/project/${projectId}`} 
            className="mt-4 inline-block bg-blue-500 text-white px-4 py-2 rounded-md"
          >
            Back to Project
          </Link>
        </div>
      )}
    </div>
  );
};

export default DocumentationViewer;