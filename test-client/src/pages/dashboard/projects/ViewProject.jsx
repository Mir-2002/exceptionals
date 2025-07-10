import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import projectService from "../../../services/projects";
import { useRefresh } from "../../../contexts/RefreshContext";

const ViewProject = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { getRefreshTrigger } = useRefresh();
  const [project, setProject] = useState(null);
  const [files, setFiles] = useState([]);
  const [structure, setStructure] = useState(null);
  const [exclusions, setExclusions] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch project info, files, structure, and exclusions
  useEffect(() => {
    const fetchProjectData = async () => {
      setLoading(true);
      setError("");
      try {
        const [projectData, filesData, structureData, exclusionsData] =
          await Promise.all([
            projectService.getProject(projectId),
            projectService.getProjectFiles(projectId),
            projectService.getProjectStructure(projectId),
            projectService.getProjectExclusions(projectId),
          ]);

        setProject(projectData);
        setFiles(filesData);
        setStructure(structureData);
        setExclusions(exclusionsData);
      } catch (err) {
        setError("Failed to load project data.");
      } finally {
        setLoading(false);
      }
    };
    fetchProjectData();
    // eslint-disable-next-line
  }, [projectId, getRefreshTrigger("project-files")]);

  // Render folder/file tree recursively
  const renderTreeNode = (node, level = 0) => {
    const indent = level * 20;
    const isExcluded =
      node.excluded || node.default_exclusion || node.inherited_exclusion;

    return (
      <div key={node.name} style={{ marginLeft: `${indent}px` }}>
        <div
          className={`flex items-center py-1 ${
            isExcluded ? "text-gray-400 line-through" : "text-gray-800"
          }`}
        >
          {node.type === "folder" ? (
            <span className="mr-2">📁</span>
          ) : (
            <span className="mr-2">📄</span>
          )}
          <span className="text-sm">
            {node.name}
            {node.type === "file" && node.size && (
              <span className="text-xs text-gray-500 ml-2">
                ({formatFileSize(node.size)})
              </span>
            )}
            {node.type === "file" && node.processed && (
              <span className="text-xs text-green-600 ml-2">✓ Processed</span>
            )}
          </span>
          {isExcluded && (
            <span className="text-xs text-red-500 ml-2">
              {node.default_exclusion
                ? "[Default Excluded]"
                : node.inherited_exclusion
                ? "[Inherited Excluded]"
                : "[Excluded]"}
            </span>
          )}
        </div>
        {node.children &&
          node.children.map((child) => renderTreeNode(child, level + 1))}
      </div>
    );
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Get processing status
  const getProcessingStatus = () => {
    if (!project) return "Unknown";
    return project.processing_status || "Not Started";
  };

  // Get processed file count
  const getProcessedFileCount = () => {
    if (!files || files.length === 0) return 0;
    return files.filter((file) => file.processed).length;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-gray-500 text-lg">Loading project...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-red-500 text-lg">{error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Return Button */}
      <div className="flex justify-start">
        <button
          onClick={() => navigate("/dashboard/projects")}
          className="flex items-center px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <span className="mr-2">←</span>
          Back to Projects
        </button>
      </div>

      {/* Project Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          {project?.name || "Project"}
        </h1>
        <p className="text-lg text-gray-600 mb-4">
          {project?.description || "No description available"}
        </p>

        {/* Project Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {files?.length || 0}
            </div>
            <div className="text-sm text-gray-600">Total Files</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {getProcessedFileCount()}
            </div>
            <div className="text-sm text-gray-600">Processed Files</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {project?.file_count || 0}
            </div>
            <div className="text-sm text-gray-600">File Count</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="text-sm font-semibold text-orange-600">
              {getProcessingStatus()}
            </div>
            <div className="text-sm text-gray-600">Status</div>
          </div>
        </div>
      </div>

      {/* Project Structure */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Project Structure
        </h2>
        {structure && structure.root ? (
          <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
            <div className="text-sm text-gray-600 mb-2">
              Default Exclusions:{" "}
              {structure.use_default_exclusions ? (
                <span className="text-green-600 font-semibold">Enabled</span>
              ) : (
                <span className="text-red-600 font-semibold">Disabled</span>
              )}
            </div>
            {renderTreeNode(structure.root)}
          </div>
        ) : (
          <div className="text-gray-500 text-center py-8">
            No project structure available
          </div>
        )}
      </div>

      {/* Project Exclusions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Project Exclusions
        </h2>
        {exclusions ? (
          <div className="space-y-4">
            {/* Directory Exclusions */}
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                📁 Directory Exclusions (Project Level)
              </h3>
              {exclusions.excluded_directories &&
              exclusions.excluded_directories.length > 0 ? (
                <div className="bg-red-50 p-3 rounded-lg">
                  <ul className="list-disc list-inside space-y-1">
                    {exclusions.excluded_directories.map((dir, index) => (
                      <li key={index} className="text-sm text-red-700">
                        {dir}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="text-gray-500 text-sm">
                  No directory exclusions set
                </div>
              )}
            </div>

            {/* File Exclusions */}
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                📄 File Exclusions (Project Level)
              </h3>
              {exclusions.excluded_files &&
              exclusions.excluded_files.length > 0 ? (
                <div className="bg-red-50 p-3 rounded-lg">
                  <ul className="list-disc list-inside space-y-1">
                    {exclusions.excluded_files.map((file, index) => (
                      <li key={index} className="text-sm text-red-700">
                        {file}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="text-gray-500 text-sm">
                  No file exclusions set
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-gray-500 text-center py-8">
            No exclusion data available
          </div>
        )}
      </div>

      {/* File List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Files</h2>
        {files && files.length > 0 ? (
          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.id || file._id || file.name}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center">
                  <span className="mr-3">📄</span>
                  <div>
                    <div className="font-medium text-gray-800">
                      {file.file_name}
                    </div>
                    {file.relative_path && (
                      <div className="text-sm text-gray-500">
                        {file.relative_path}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {file.size && (
                    <span className="text-sm text-gray-500">
                      {formatFileSize(file.size)}
                    </span>
                  )}
                  {file.processed ? (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      Processed
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                      Not Processed
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-center py-8">
            No files uploaded yet for this project.
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewProject;
