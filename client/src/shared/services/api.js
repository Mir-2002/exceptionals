import axios from 'axios';
import { handleApiError } from '../utils/errorHandler';

// Configure base API
const API_URL = import.meta.env.VITE_API_ENDPOINT || "http://localhost:5000";
let isBackendMissing = false;

// Create axios instance with base URL
const api = axios.create({
    baseURL: API_URL,
    timeout: 5000 // 5 second timeout to fail faster on connection issues
});

// Add request interceptor for auth token
api.interceptors.request.use(
    async config => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    error => Promise.reject(error)
);

// Add response interceptor for global error handling
api.interceptors.response.use(
    response => response,
    async error => {
        const originalRequest = error.config;
        
        // If error is 401 Unauthorized and not a refresh token request
        if (error.response?.status === 401 && 
            !originalRequest._retry && 
            !originalRequest.url.includes('auth/refresh-token')) {
            
            originalRequest._retry = true;
            
            try {
                const refreshToken = localStorage.getItem('refreshToken');
                if (!refreshToken) {
                    // No refresh token, redirect to login
                    window.location.href = '/login';
                    return Promise.reject(error);
                }
                
                // Try to refresh the token
                const response = await axios.post(`${API_URL}/auth/refresh-token`, {
                    refreshToken
                });
                
                const { token, refreshToken: newRefreshToken } = response.data;
                
                // Update stored tokens
                localStorage.setItem('token', token);
                localStorage.setItem('refreshToken', newRefreshToken);
                
                // Update the original request with new token
                originalRequest.headers['Authorization'] = `Bearer ${token}`;
                
                // Retry the original request
                return axios(originalRequest);
            } catch (refreshError) {
                // If refresh fails, redirect to login
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('githubToken');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }
        
        // Special case for development mode and connection errors
        if (import.meta.env.DEV && error.message === 'Network Error') {
            console.log('Backend connection failed in development mode');
            // Don't show error toast for network errors in development
            handleApiError(error, { showToast: false });
        } else {
            // Special handling for auth errors
            if (error.response && error.response.status === 401) {
                // Clear auth tokens
                localStorage.removeItem('token');
                localStorage.removeItem('githubToken');
                
                // Only redirect if not already on login page
                if (!window.location.pathname.includes('/login')) {
                    handleApiError(error, {
                        showToast: true,
                        defaultMessage: 'Your session has expired. Redirecting to login...',
                        redirectOnAuth: true
                    });
                } else {
                    // Still handle error but don't redirect if already on login
                    handleApiError(error, {
                        showToast: true,
                        defaultMessage: 'Authentication failed'
                    });
                }
            } else {
                // Handle other errors but don't show toast (let components decide)
                handleApiError(error, { showToast: false });
            }
        }
        return Promise.reject(error);
    }
);

// Authentication API calls
export const authAPI = {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (userData) => api.post('/auth/register', userData),
    getCurrentUser: () => api.get('/auth/me'),
    githubLogin: (code) => {
        return api.post('/auth/github/callback', { code });
    },
    logout: () => api.post('/auth/logout'),
    getGitHubRepos: () => {
        const githubToken = localStorage.getItem('githubToken');
        return api.get('/github/repos', {
            headers: {
                'X-GitHub-Token': githubToken
            }
        });
    },
    refreshToken: (data) => {
        return api.post('/auth/refresh-token', data);
    }
};

// Project API calls
export const projectsAPI = {
    getAllProjects: async () => {
        try {
            if (isBackendMissing) {
                // If we already know the backend is missing, don't even try to connect
                return Promise.reject({ message: "Backend server not available" });
            }
            
            const response = await api.get('/projects');
            return response;
        } catch (error) {
            if (error.message === 'Network Error') {
                // Remember that the backend is missing to avoid future requests
                isBackendMissing = true;
                console.log("Backend server not available, consider implementing mock data");
            }
            throw error;
        }
    },
    getProjectById: (id) => api.get(`/projects/${id}`),
    createProject: (projectData) => api.post('/projects', projectData),
    updateProject: (id, projectData) => api.put(`/projects/${id}`, projectData),
    deleteProject: (id) => api.delete(`/projects/${id}`),
    getProjectStructure: (id) => api.get(`/projects/${id}/structure`),
};

// File API calls
export const filesAPI = {
    uploadFile: (projectId, file, onProgress) => {
        const formData = new FormData();
        formData.append('file', file);
        
        return api.post(`/files?projectId=${projectId}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: progressEvent => {
                if (onProgress) {
                    const percentCompleted = Math.round(
                        (progressEvent.loaded * 100) / progressEvent.total
                    );
                    onProgress(percentCompleted);
                }
            }
        });
    },
    getFileById: (id) => api.get(`/files/${id}`),
    getFileStructure: (id) => api.get(`/files/${id}/structure`),
    deleteFile: (id) => api.delete(`/files/${id}`),
    getFilesByProjectId: (projectId) => api.get(`/projects/${projectId}/files`),
    getFileContent: (id) => api.get(`/files/${id}/content`),
    uploadZipFile: (projectId, zipFile, onProgress) => {
        const formData = new FormData();
        formData.append('file', zipFile);
        
        return api.post(`/files/zip?projectId=${projectId}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: progressEvent => {
                if (onProgress) {
                    const percentCompleted = Math.round(
                        (progressEvent.loaded * 100) / progressEvent.total
                    );
                    onProgress(percentCompleted);
                }
            }
        });
    },
    // Add this new method for folder uploads
    uploadFolderWithProgress: (projectId, files, onProgress) => {
        const formData = new FormData();
        
        // Append each file to the form data
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            // Use the file's path to preserve folder structure
            formData.append('files', file, file.webkitRelativePath || file.name);
        }
        
        return api.post(`/files/folder?projectId=${projectId}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: progressEvent => {
                if (onProgress) {
                    const percentCompleted = Math.round(
                        (progressEvent.loaded * 100) / progressEvent.total
                    );
                    onProgress(percentCompleted);
                }
            }
        });
    },
    // Add method for repository uploads
    processRepository: (projectId, { url, branch, onProgress }) => {
        return api.post(`/projects/${projectId}/repository`, { url, branch }, {
            onUploadProgress: progressEvent => {
                if (onProgress) {
                    const percentCompleted = Math.round(
                        (progressEvent.loaded * 100) / progressEvent.total
                    );
                    onProgress(percentCompleted);
                }
            }
        });
    }
};

// Documentation API
export const docsAPI = {
  getDocumentation: (projectId) => api.get(`/projects/${projectId}/documentation`),
  getFileDocumentation: (fileId) => api.get(`/files/${fileId}/documentation`),
  generateDocumentation: (projectId) => api.post(`/projects/${projectId}/documentation/generate`),
  updateDocumentation: (fileId, data) => api.put(`/files/${fileId}/documentation`, data),
  exportDocumentation: (projectId, format) => 
    api.get(`/projects/${projectId}/documentation/export`, { 
      params: { format },
      responseType: 'blob' // Important for file downloads
    }),
};

export default api;
