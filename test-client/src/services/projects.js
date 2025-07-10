import axios from "axios";

const API_URL = "http://localhost:8000/api"; // Adjust if your backend URL is different

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const projectService = {
  // Get all projects for the current user
  getMyProjects: async () => {
    const response = await axios.get(`${API_URL}/projects`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Get a specific project by ID
  getProject: async (projectId) => {
    const response = await axios.get(`${API_URL}/projects/${projectId}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Create a new project
  createProject: async (projectData) => {
    const response = await axios.post(`${API_URL}/projects`, projectData, {
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
    });
    return response.data;
  },

  // Update a project
  updateProject: async (projectId, updateData) => {
    const response = await axios.patch(
      `${API_URL}/projects/${projectId}`,
      updateData,
      {
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  },

  // Delete a project
  deleteProject: async (projectId) => {
    try {
      const response = await axios.delete(`${API_URL}/projects/${projectId}`, {
        headers: getAuthHeaders(),
      });
      console.log("Project deleted successfully from service:", projectId); // Add this line
      return response.data; // Return the response data
    } catch (error) {
      console.error("Error in deleteProject service:", error);
      throw error; // Re-throw the error
    }
  },

  uploadPythonFile: async (projectId, file) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await axios.post(
      `${API_URL}/projects/${projectId}/files`,
      formData,
      {
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },

  // Upload a ZIP file to a project
  uploadZip: async (projectId, file) => {
    const formData = new FormData();
    formData.append("zip_file", file);

    const response = await axios.post(
      `${API_URL}/projects/${projectId}/upload-zip`,
      formData,
      {
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },

  getProjectFiles: async (projectId) => {
    const response = await axios.get(`${API_URL}/projects/${projectId}/files`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Get project structure (folders/files tree)
  getProjectStructure: async (projectId, useDefaultExclusions = true) => {
    const response = await axios.get(
      `${API_URL}/projects/${projectId}/structure?use_default_exclusions=${useDefaultExclusions}`,
      {
        headers: getAuthHeaders(),
      }
    );
    return response.data;
  },

  // Get project exclusions
  getProjectExclusions: async (projectId) => {
    const response = await axios.get(
      `${API_URL}/projects/${projectId}/exclusions`,
      {
        headers: getAuthHeaders(),
      }
    );
    return response.data;
  },

  // Update project exclusions
  updateProjectExclusions: async (projectId, exclusions) => {
    const response = await axios.post(
      `${API_URL}/projects/${projectId}/exclusions`,
      exclusions,
      {
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  },
  // Add these methods to your existing projectService object

  // File management methods
  deleteFile: async (fileId) => {
    const response = await axios.delete(`${API_URL}/files/${fileId}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  getFileContent: async (fileId) => {
    const response = await axios.get(`${API_URL}/files/${fileId}/content`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  getFileStructure: async (fileId) => {
    const response = await axios.get(`${API_URL}/files/${fileId}/structure`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  getFileExclusions: async (fileId) => {
    const response = await axios.get(`${API_URL}/files/${fileId}/exclusions`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  updateFileExclusions: async (fileId, exclusions) => {
    const response = await axios.post(
      `${API_URL}/files/${fileId}/exclusions`,
      exclusions,
      {
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  },

  // Project documentation
  generateProjectDocumentation: async (projectId) => {
    const response = await axios.post(
      `${API_URL}/projects/${projectId}/document`,
      {},
      {
        headers: getAuthHeaders(),
      }
    );
    return response.data;
  },
};

export default projectService;
