import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import projectService from "../../../services/projects";
import { useRefresh } from "../../../contexts/RefreshContext";

const ManageProject = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { getRefreshTrigger, triggerRefresh } = useRefresh();

  // State management
  const [project, setProject] = useState(null);
  const [files, setFiles] = useState([]);
  const [exclusions, setExclusions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Modal states
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showExclusionsModal, setShowExclusionsModal] = useState(false);
  const [showFileExclusionsModal, setShowFileExclusionsModal] = useState(null);
  const [showEditProjectModal, setShowEditProjectModal] = useState(false);

  // Form states
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [projectEditData, setProjectEditData] = useState({
    name: "",
    description: "",
  });
  const [projectExclusions, setProjectExclusions] = useState({
    excluded_directories: [],
    excluded_files: [],
  });
  const [fileExclusions, setFileExclusions] = useState({
    excluded_classes: [],
    excluded_functions: [],
  });

  // Fetch project data
  useEffect(() => {
    fetchProjectData();
  }, [projectId, getRefreshTrigger("project-management")]);

  const fetchProjectData = async () => {
    setLoading(true);
    setError("");
    try {
      const [projectData, filesData, exclusionsData] = await Promise.all([
        projectService.getProject(projectId),
        projectService.getProjectFiles(projectId),
        projectService.getProjectExclusions(projectId),
      ]);

      setProject(projectData);
      setFiles(filesData);
      setExclusions(exclusionsData);
      setProjectEditData({
        name: projectData.name,
        description: projectData.description,
      });
      setProjectExclusions({
        excluded_directories: exclusionsData.excluded_directories || [],
        excluded_files: exclusionsData.excluded_files || [],
      });
    } catch (err) {
      setError("Failed to load project data.");
    } finally {
      setLoading(false);
    }
  };

  // File upload handler
  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setError("Please select a file to upload.");
      return;
    }

    setUploading(true);
    setError("");
    setSuccess("");

    try {
      const ext = selectedFile.name.split(".").pop().toLowerCase();
      if (ext === "zip") {
        await projectService.uploadZip(projectId, selectedFile);
      } else if (ext === "py") {
        await projectService.uploadPythonFile(projectId, selectedFile);
      } else {
        throw new Error("Only .py and .zip files are supported");
      }

      setSuccess("File uploaded successfully!");
      setSelectedFile(null);
      setShowUploadModal(false);
      triggerRefresh("project-management");
    } catch (err) {
      setError("Failed to upload file.");
    } finally {
      setUploading(false);
    }
  };

  // Delete file handler
  const handleDeleteFile = async (fileId, fileName) => {
    if (!window.confirm(`Are you sure you want to delete ${fileName}?`)) return;

    try {
      await projectService.deleteFile(fileId);
      setSuccess(`File ${fileName} deleted successfully!`);
      triggerRefresh("project-management");
    } catch (err) {
      setError("Failed to delete file.");
    }
  };

  // Update project handler
  const handleUpdateProject = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      await projectService.updateProject(projectId, projectEditData);
      setSuccess("Project updated successfully!");
      setShowEditProjectModal(false);
      triggerRefresh("project-management");
    } catch (err) {
      setError("Failed to update project.");
    }
  };

  // Update project exclusions handler
  const handleUpdateProjectExclusions = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      await projectService.updateProjectExclusions(
        projectId,
        projectExclusions
      );
      setSuccess("Project exclusions updated successfully!");
      setShowExclusionsModal(false);
      triggerRefresh("project-management");
    } catch (err) {
      setError("Failed to update exclusions.");
    }
  };

  // Update file exclusions handler
  const handleUpdateFileExclusions = async (e, fileId) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      await projectService.updateFileExclusions(fileId, fileExclusions);
      setSuccess("File exclusions updated successfully!");
      setShowFileExclusionsModal(null);
      triggerRefresh("project-management");
    } catch (err) {
      setError("Failed to update file exclusions.");
    }
  };

  // Load file exclusions
  const loadFileExclusions = async (fileId) => {
    try {
      const data = await projectService.getFileExclusions(fileId);
      setFileExclusions(data);
      setShowFileExclusionsModal(fileId);
    } catch (err) {
      setError("Failed to load file exclusions.");
    }
  };

  // Generate documentation
  const handleGenerateDocumentation = async () => {
    if (!window.confirm("Generate documentation for this project?")) return;

    try {
      setSuccess("Documentation generation started...");
      await projectService.generateProjectDocumentation(projectId);
      setSuccess("Documentation generated successfully!");
      triggerRefresh("project-management");
    } catch (err) {
      setError("Failed to generate documentation.");
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-gray-500 text-lg">Loading project...</div>
      </div>
    );
  }

  if (error && !project) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-red-500 text-lg">{error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Manage: {project?.name || "Project"}
          </h1>
          <p className="text-gray-600 mt-2">
            {project?.description || "No description available"}
          </p>
        </div>
        <button
          onClick={() => navigate("/dashboard/projects")}
          className="flex items-center px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <span className="mr-2">←</span>
          Back to Projects
        </button>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Action Buttons */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Project Actions
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => setShowUploadModal(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Upload Files
          </button>
          <button
            onClick={() => setShowEditProjectModal(true)}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Edit Project
          </button>
          <button
            onClick={() => setShowExclusionsModal(true)}
            className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Manage Exclusions
          </button>
          <button
            onClick={handleGenerateDocumentation}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Generate Docs
          </button>
        </div>
      </div>

      {/* Files List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Project Files ({files.length})
        </h2>
        {files.length > 0 ? (
          <div className="space-y-3">
            {files.map((file) => (
              <div
                key={file._id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center">
                  <span className="mr-3 text-lg">📄</span>
                  <div>
                    <div className="font-medium text-gray-800">
                      {file.file_name}
                    </div>
                    {file.relative_path && (
                      <div className="text-sm text-gray-500">
                        {file.relative_path}
                      </div>
                    )}
                    <div className="text-xs text-gray-500 mt-1">
                      {file.size && formatFileSize(file.size)} •
                      {file.processed ? (
                        <span className="text-green-600 ml-1">Processed</span>
                      ) : (
                        <span className="text-gray-600 ml-1">
                          Not Processed
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => loadFileExclusions(file._id)}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors text-sm"
                  >
                    Exclusions
                  </button>
                  <button
                    onClick={() => handleDeleteFile(file._id, file.file_name)}
                    className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-center py-8">
            No files uploaded yet. Click "Upload Files" to get started.
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Upload File</h3>
            <form onSubmit={handleFileUpload}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select File (.py or .zip)
                </label>
                <input
                  type="file"
                  accept=".py,.zip"
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                >
                  {uploading ? "Uploading..." : "Upload"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {showEditProjectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Edit Project</h3>
            <form onSubmit={handleUpdateProject}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Name
                </label>
                <input
                  type="text"
                  value={projectEditData.name}
                  onChange={(e) =>
                    setProjectEditData({
                      ...projectEditData,
                      name: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={projectEditData.description}
                  onChange={(e) =>
                    setProjectEditData({
                      ...projectEditData,
                      description: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="4"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowEditProjectModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Project Exclusions Modal */}
      {showExclusionsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h3 className="text-lg font-semibold mb-4">
              Manage Project Exclusions
            </h3>
            <form onSubmit={handleUpdateProjectExclusions}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Excluded Directories (comma-separated)
                </label>
                <input
                  type="text"
                  value={projectExclusions.excluded_directories.join(", ")}
                  onChange={(e) =>
                    setProjectExclusions({
                      ...projectExclusions,
                      excluded_directories: e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter((s) => s),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., node_modules, __pycache__, .git"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Excluded Files (comma-separated)
                </label>
                <input
                  type="text"
                  value={projectExclusions.excluded_files.join(", ")}
                  onChange={(e) =>
                    setProjectExclusions({
                      ...projectExclusions,
                      excluded_files: e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter((s) => s),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., *.pyc, *.log, .env"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowExclusionsModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Save Exclusions
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* File Exclusions Modal */}
      {showFileExclusionsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h3 className="text-lg font-semibold mb-4">
              Manage File Exclusions
            </h3>
            <form
              onSubmit={(e) =>
                handleUpdateFileExclusions(e, showFileExclusionsModal)
              }
            >
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Excluded Classes (comma-separated)
                </label>
                <input
                  type="text"
                  value={fileExclusions.excluded_classes.join(", ")}
                  onChange={(e) =>
                    setFileExclusions({
                      ...fileExclusions,
                      excluded_classes: e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter((s) => s),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., TestClass, PrivateClass"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Excluded Functions (comma-separated)
                </label>
                <input
                  type="text"
                  value={fileExclusions.excluded_functions.join(", ")}
                  onChange={(e) =>
                    setFileExclusions({
                      ...fileExclusions,
                      excluded_functions: e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter((s) => s),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., _private_method, test_function"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowFileExclusionsModal(null)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Save Exclusions
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageProject;
