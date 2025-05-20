import axios from 'axios';
import { handleApiError } from '../utils/errorHandler';

// Configure base API
const API_URL = import.meta.env.VITE_API_ENDPOINT || "http://localhost:5000";

// Create axios instance with base URL
const api = axios.create({
    baseURL: API_URL
});

// Add request interceptor for auth token
api.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Add response interceptor for global error handling
api.interceptors.response.use(
    response => response,
    error => {
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
        
        return Promise.reject(error);
    }
);

// Authentication API calls
export const authAPI = {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (userData) => api.post('/auth/register', userData),
    getCurrentUser: () => api.get('/auth/me'),
    githubLogin: (code) => api.post('/auth/github/callback', { code }),
    logout: () => api.post('/auth/logout'),
};

// Project API calls
export const projectsAPI = {
    getAllProjects: () => api.get('/projects'),
    getProjectById: (id) => api.get(`/projects/${id}`),
    createProject: (projectData) => api.post('/projects', projectData),
    updateProject: (id, projectData) => api.patch(`/projects/${id}`, projectData),
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
